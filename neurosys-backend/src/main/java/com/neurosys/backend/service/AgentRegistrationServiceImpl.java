package com.neurosys.backend.service;

import com.neurosys.backend.dto.request.AgentRegistrationRequest;
import com.neurosys.backend.dto.response.AgentRegistrationResponse;
import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.enums.ComputerStatus;
import com.neurosys.backend.repository.ComputerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentRegistrationServiceImpl implements AgentRegistrationService {

    private final ComputerRepository computerRepository;

    @Override
    @Transactional
    public AgentRegistrationResponse registerAgent(AgentRegistrationRequest request) {
        log.info("Processing agent registration request for MAC: {}, Hostname: {}", request.getMacAddress(), request.getHostname());

        Optional<Computer> existingByMac = computerRepository.findByMacAddress(request.getMacAddress());
        Optional<Computer> existingByAgentId = computerRepository.findByAgentId(request.getAgentId());

        Computer computer;
        if (existingByMac.isPresent()) {
            computer = existingByMac.get();
            log.info("Updating existing computer record found by MAC: {}", request.getMacAddress());
            computer.setAgentId(request.getAgentId());
            computer.setHostname(request.getHostname());
            computer.setComputerName(request.getComputerName());
            computer.setIpAddress(request.getIpAddress());
            computer.setOsName(request.getOsName());
            computer.setOsVersion(request.getOsVersion());
            computer.setLabName(request.getLabName());
            computer.setCpuModel(request.getCpuModel());
            computer.setTotalRamMb(request.getTotalRamMb());
            computer.setAgentVersion(request.getAgentVersion());
            if (computer.getStatus() != ComputerStatus.PENDING && computer.getStatus() != ComputerStatus.REJECTED) {
                computer.setStatus(ComputerStatus.ONLINE);
            }
            computer.setLastSeenAt(Instant.now());
        } else if (existingByAgentId.isPresent()) {
            computer = existingByAgentId.get();
            log.info("Updating existing computer record found by Agent ID: {}", request.getAgentId());
            computer.setHostname(request.getHostname());
            computer.setIpAddress(request.getIpAddress());
            computer.setMacAddress(request.getMacAddress());
            if (computer.getStatus() != ComputerStatus.PENDING && computer.getStatus() != ComputerStatus.REJECTED) {
                computer.setStatus(ComputerStatus.ONLINE);
            }
            computer.setLastSeenAt(Instant.now());
        } else {
            log.info("Creating new computer record for Agent ID: {} with ONLINE status", request.getAgentId());
            computer = Computer.builder()
                    .agentId(request.getAgentId())
                    .hostname(request.getHostname())
                    .computerName(request.getComputerName())
                    .ipAddress(request.getIpAddress())
                    .macAddress(request.getMacAddress())
                    .osName(request.getOsName())
                    .osVersion(request.getOsVersion())
                    .labName(request.getLabName() != null ? request.getLabName() : "General Lab")
                    .cpuModel(request.getCpuModel())
                    .totalRamMb(request.getTotalRamMb())
                    .agentVersion(request.getAgentVersion())
                    .status(ComputerStatus.ONLINE)
                    .lastSeenAt(Instant.now())
                    .build();
        }

        computer = computerRepository.save(computer);
        String agentToken = "AGENT-AUTH-TOKEN-" + UUID.nameUUIDFromBytes(computer.getAgentId().getBytes());

        return AgentRegistrationResponse.builder()
                .computerId(computer.getId())
                .agentId(computer.getAgentId())
                .status(computer.getStatus().name())
                .agentAuthToken(agentToken)
                .collectionIntervalSeconds(1)
                .registeredAt(computer.getLastSeenAt())
                .build();
    }
}
