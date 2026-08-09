package com.neurosys.backend.scheduler;

import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.enums.ComputerStatus;
import com.neurosys.backend.repository.ComputerRepository;
import com.neurosys.backend.service.AlertEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OfflineDetectionScheduler {

    private final ComputerRepository computerRepository;
    private final AlertEngineService alertEngineService;

    @Scheduled(fixedRate = 15000) // Runs every 15 seconds
    @Transactional
    public void detectOfflineComputers() {
        Instant threshold = Instant.now().minus(60, ChronoUnit.SECONDS);
        List<Computer> staleComputers = computerRepository.findStaleOnlineComputers(threshold);

        for (Computer c : staleComputers) {
            log.warn("Computer {} (Agent: {}) missed heartbeat (>60s). Marking OFFLINE.", c.getHostname(), c.getAgentId());
            c.setStatus(ComputerStatus.OFFLINE);
            computerRepository.save(c);
            alertEngineService.triggerOfflineAlert(c);
        }
    }
}
