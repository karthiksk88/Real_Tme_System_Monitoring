package com.neurosys.backend.service;

import com.neurosys.backend.dto.request.CommandStatusUpdateRequest;
import com.neurosys.backend.dto.response.RemotePowerAuditDto;
import com.neurosys.backend.dto.response.RemotePowerCommandDto;
import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.entity.RemotePowerAudit;
import com.neurosys.backend.entity.RemotePowerCommand;
import com.neurosys.backend.enums.ComputerStatus;
import com.neurosys.backend.enums.PowerCommandStatus;
import com.neurosys.backend.enums.PowerCommandType;
import com.neurosys.backend.exception.ResourceNotFoundException;
import com.neurosys.backend.repository.ComputerRepository;
import com.neurosys.backend.repository.RemotePowerAuditRepository;
import com.neurosys.backend.repository.RemotePowerCommandRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RemotePowerServiceImpl implements RemotePowerService {

    private final RemotePowerCommandRepository commandRepository;
    private final RemotePowerAuditRepository auditRepository;
    private final ComputerRepository computerRepository;

    @Override
    @Transactional
    public RemotePowerCommandDto issueCommand(String computerId, PowerCommandType type, String requestedBy) {
        Computer computer = computerRepository.findById(computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Computer", "id", computerId));

        if (computer.getStatus() == ComputerStatus.PENDING || computer.getStatus() == ComputerStatus.REJECTED) {
            log.warn("Attempted remote power action on unapproved computer {}", computer.getHostname());
            throw new IllegalArgumentException("Computer endpoint is unapproved. Remote actions unavailable.");
        }

        // Check for existing active command to prevent rapid duplicate clicks
        Optional<RemotePowerCommand> activeCmd = commandRepository
                .findFirstByComputerIdAndStatusInOrderByCreatedAtDesc(
                        computerId, List.of(PowerCommandStatus.PENDING, PowerCommandStatus.SENT, PowerCommandStatus.EXECUTING));

        if (activeCmd.isPresent()) {
            RemotePowerCommand existing = activeCmd.get();
            long secondsAgo = Duration.between(existing.getCreatedAt(), Instant.now()).getSeconds();
            if (secondsAgo < 15) {
                log.info("Returning existing pending/executing command {} for computer {}", existing.getId(), computer.getHostname());
                return mapToCommandDto(existing);
            }
        }

        // Create new RemotePowerCommand (queue command so agent will execute immediately upon polling/heartbeat)
        RemotePowerCommand command = RemotePowerCommand.builder()
                .computer(computer)
                .commandType(type)
                .status(PowerCommandStatus.PENDING)
                .requestedBy(requestedBy != null ? requestedBy : "Administrator")
                .build();

        command.setCreatedAt(Instant.now());
        command.setUpdatedAt(Instant.now());
        command = commandRepository.save(command);

        // Record Audit Log
        RemotePowerAudit audit = RemotePowerAudit.builder()
                .userName(command.getRequestedBy())
                .computerName(computer.getHostname())
                .computerId(computer.getId())
                .action(type)
                .status("QUEUED")
                .build();
        audit.setCreatedAt(Instant.now());
        audit.setUpdatedAt(Instant.now());
        auditRepository.save(audit);

        log.info("Issued {} command for computer {} ({}) by user {}", type, computer.getHostname(), computer.getId(), command.getRequestedBy());

        return mapToCommandDto(command);
    }

    @Override
    @Transactional
    public RemotePowerCommandDto getPendingCommandForAgent(String agentId) {
        Optional<RemotePowerCommand> pendingCmd = commandRepository
                .findFirstByComputerAgentIdAndStatusOrderByCreatedAtAsc(agentId, PowerCommandStatus.PENDING);

        if (pendingCmd.isPresent()) {
            RemotePowerCommand command = pendingCmd.get();
            command.setStatus(PowerCommandStatus.SENT);
            command.setUpdatedAt(Instant.now());
            commandRepository.save(command);
            log.info("Delivered power command {} ({}) to agent {}", command.getId(), command.getCommandType(), agentId);
            return mapToCommandDto(command);
        }
        return null;
    }

    @Override
    @Transactional
    public RemotePowerCommandDto updateCommandStatus(CommandStatusUpdateRequest request) {
        RemotePowerCommand command = commandRepository.findById(request.getCommandId())
                .orElseThrow(() -> new ResourceNotFoundException("RemotePowerCommand", "id", request.getCommandId()));

        command.setStatus(request.getStatus());
        if (request.getFailureReason() != null) {
            command.setFailureReason(request.getFailureReason());
        }
        command.setUpdatedAt(Instant.now());
        commandRepository.save(command);

        // Update corresponding Audit record
        RemotePowerAudit audit = RemotePowerAudit.builder()
                .userName(command.getRequestedBy())
                .computerName(command.getComputer().getHostname())
                .computerId(command.getComputer().getId())
                .action(command.getCommandType())
                .status(request.getStatus().name())
                .failureReason(request.getFailureReason())
                .build();
        audit.setCreatedAt(Instant.now());
        audit.setUpdatedAt(Instant.now());
        auditRepository.save(audit);

        log.info("Updated power command {} status to {}", command.getId(), request.getStatus());
        return mapToCommandDto(command);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RemotePowerAuditDto> getAuditsForComputer(String computerId) {
        return auditRepository.findByComputerIdOrderByTimestampDesc(computerId)
                .stream()
                .map(this::mapToAuditDto)
                .toList();
    }

    private RemotePowerCommandDto mapToCommandDto(RemotePowerCommand entity) {
        return RemotePowerCommandDto.builder()
                .id(entity.getId())
                .computerId(entity.getComputer().getId())
                .computerName(entity.getComputer().getHostname())
                .commandType(entity.getCommandType())
                .status(entity.getStatus())
                .requestedBy(entity.getRequestedBy())
                .failureReason(entity.getFailureReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private RemotePowerAuditDto mapToAuditDto(RemotePowerAudit entity) {
        return RemotePowerAuditDto.builder()
                .id(entity.getId())
                .userName(entity.getUserName())
                .computerName(entity.getComputerName())
                .computerId(entity.getComputerId())
                .action(entity.getAction())
                .timestamp(entity.getTimestamp())
                .status(entity.getStatus())
                .failureReason(entity.getFailureReason())
                .build();
    }
}
