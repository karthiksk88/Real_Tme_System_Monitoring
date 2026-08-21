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
        log.info("[INFO] Agent registration request received from AgentID: {}, Hostname: {}, MAC: {}", 
                request.getAgentId(), request.getHostname(), request.getMacAddress());

        // 1. First look up by persistent Agent ID
        Optional<Computer> existingByAgentId = computerRepository.findByAgentId(request.getAgentId());
        // 2. Fallback lookup by MAC Address
        Optional<Computer> existingByMac = request.getMacAddress() != null && !request.getMacAddress().isEmpty() 
                ? computerRepository.findByMacAddress(request.getMacAddress()) 
                : Optional.empty();

        Computer computer;
        if (existingByAgentId.isPresent()) {
            computer = existingByAgentId.get();
            ComputerStatus oldStatus = computer.getStatus();
            log.info("[INFO] Existing agent recognized: {} (Hostname: {})", computer.getAgentId(), computer.getHostname());
            
            computer.setHostname(request.getHostname());
            computer.setComputerName(request.getComputerName() != null ? request.getComputerName() : request.getHostname());
            computer.setIpAddress(request.getIpAddress());
            if (request.getMacAddress() != null && !request.getMacAddress().isEmpty()) {
                computer.setMacAddress(request.getMacAddress());
            }
            computer.setOsName(request.getOsName());
            computer.setOsVersion(request.getOsVersion());
            if (request.getCpuModel() != null) computer.setCpuModel(request.getCpuModel());
            if (request.getTotalRamMb() != null) computer.setTotalRamMb(request.getTotalRamMb());
            if (request.getAgentVersion() != null) computer.setAgentVersion(request.getAgentVersion());
            
            // Retain lab assignment if already assigned
            if (computer.getLabName() == null || computer.getLabName().isEmpty()) {
                computer.setLabName(request.getLabName() != null ? request.getLabName() : "General Lab");
            }
            
            // Retain approval state if already approved/active
            if (computer.getStatus() == ComputerStatus.OFFLINE || computer.getStatus() == ComputerStatus.UNKNOWN) {
                computer.setStatus(ComputerStatus.ONLINE);
                log.info("[INFO] PC {} status changed {} → ONLINE", computer.getHostname(), oldStatus);
            }
            computer.setLastSeenAt(Instant.now());

        } else if (existingByMac.isPresent()) {
            computer = existingByMac.get();
            ComputerStatus oldStatus = computer.getStatus();
            log.info("[INFO] Existing computer recognized by MAC {}: Updating AgentID to {}", request.getMacAddress(), request.getAgentId());
            
            computer.setAgentId(request.getAgentId());
            computer.setHostname(request.getHostname());
            computer.setComputerName(request.getComputerName() != null ? request.getComputerName() : request.getHostname());
            computer.setIpAddress(request.getIpAddress());
            computer.setOsName(request.getOsName());
            computer.setOsVersion(request.getOsVersion());
            if (request.getCpuModel() != null) computer.setCpuModel(request.getCpuModel());
            if (request.getTotalRamMb() != null) computer.setTotalRamMb(request.getTotalRamMb());
            if (request.getAgentVersion() != null) computer.setAgentVersion(request.getAgentVersion());

            if (computer.getStatus() == ComputerStatus.OFFLINE || computer.getStatus() == ComputerStatus.UNKNOWN) {
                computer.setStatus(ComputerStatus.ONLINE);
                log.info("[INFO] PC {} status changed {} → ONLINE", computer.getHostname(), oldStatus);
            }
            computer.setLastSeenAt(Instant.now());

        } else {
            log.info("[INFO] New agent registered: AGENT-{} (Hostname: {})", request.getAgentId(), request.getHostname());
            computer = Computer.builder()
                    .agentId(request.getAgentId())
                    .hostname(request.getHostname())
                    .computerName(request.getComputerName() != null ? request.getComputerName() : request.getHostname())
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
            log.info("[INFO] PC {} status set to ONLINE", computer.getHostname());
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
