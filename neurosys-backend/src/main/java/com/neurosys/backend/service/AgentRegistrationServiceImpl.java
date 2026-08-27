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

        // 1. Look up by persistent Agent ID
        Optional<Computer> existingByAgentId = computerRepository.findByAgentId(request.getAgentId());
        
        // 2. Fallback lookup by MAC Address
        Optional<Computer> existingByMac = request.getMacAddress() != null && !request.getMacAddress().isEmpty() 
                ? computerRepository.findByMacAddress(request.getMacAddress()) 
                : Optional.empty();

        // 3. Fallback lookup by Hostname
        Optional<Computer> existingByHostname = request.getHostname() != null && !request.getHostname().isEmpty()
                ? computerRepository.findByHostnameIgnoreCase(request.getHostname())
                : Optional.empty();

        Computer computer;
        if (existingByAgentId.isPresent() || existingByMac.isPresent() || existingByHostname.isPresent()) {
            computer = existingByAgentId.orElseGet(() -> existingByMac.orElseGet(existingByHostname::get));
            ComputerStatus oldStatus = computer.getStatus();
            log.info("[INFO] Recognized existing computer endpoint: ID={}, Hostname={}", computer.getAgentId(), computer.getHostname());
            
            computer.setAgentId(request.getAgentId());
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
            
            if (computer.getLabName() == null || computer.getLabName().isEmpty()) {
                computer.setLabName(request.getLabName() != null ? request.getLabName() : "Lab Alpha");
            }
            
            // Instantly transition status to ONLINE
            computer.setStatus(ComputerStatus.ONLINE);
            computer.setLastSeenAt(Instant.now());
            log.info("[INFO] Computer {} status updated from {} → ONLINE", computer.getHostname(), oldStatus);

        } else {
            log.info("[INFO] New computer agent registered: AgentID={}, Hostname={}", request.getAgentId(), request.getHostname());
            computer = Computer.builder()
                    .agentId(request.getAgentId())
                    .hostname(request.getHostname())
                    .computerName(request.getComputerName() != null ? request.getComputerName() : request.getHostname())
                    .ipAddress(request.getIpAddress())
                    .macAddress(request.getMacAddress() != null ? request.getMacAddress() : "00:00:00:00:00:00")
                    .osName(request.getOsName() != null ? request.getOsName() : "Windows")
                    .osVersion(request.getOsVersion() != null ? request.getOsVersion() : "11")
                    .labName(request.getLabName() != null ? request.getLabName() : "Lab Alpha")
                    .cpuModel(request.getCpuModel())
                    .totalRamMb(request.getTotalRamMb())
                    .agentVersion(request.getAgentVersion())
                    .status(ComputerStatus.ONLINE)
                    .lastSeenAt(Instant.now())
                    .build();
            log.info("[INFO] New PC {} registered as ONLINE", computer.getHostname());
        }

        computer = computerRepository.save(computer);
        String agentToken = "AGENT-AUTH-TOKEN-" + UUID.nameUUIDFromBytes(computer.getAgentId().getBytes());

        return AgentRegistrationResponse.builder()
                .computerId(computer.getId())
                .agentId(computer.getAgentId())
                .status(computer.getStatus().name())
                .agentAuthToken(agentToken)
                .collectionIntervalSeconds(3)
                .registeredAt(computer.getLastSeenAt())
                .build();
    }
}
