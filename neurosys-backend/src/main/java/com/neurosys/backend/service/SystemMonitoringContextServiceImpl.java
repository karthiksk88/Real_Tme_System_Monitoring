package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.ComputerDto;
import com.neurosys.backend.enums.ComputerStatus;
import com.neurosys.backend.repository.ComputerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemMonitoringContextServiceImpl implements SystemMonitoringContextService {

    private final ComputerService computerService;

    @Override
    @Transactional(readOnly = true)
    public List<ComputerDto> getOfflineComputers() {
        return computerService.getAllComputers().stream()
                .filter(c -> "OFFLINE".equalsIgnoreCase(c.getStatus()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComputerDto> getTopCpuComputers() {
        return computerService.getAllComputers().stream()
                .sorted(Comparator.comparing((ComputerDto c) -> c.getCurrentCpuUsage() != null ? c.getCurrentCpuUsage() : 0.0).reversed())
                .limit(5)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComputerDto> getLowDiskComputers() {
        return computerService.getAllComputers().stream()
                .filter(c -> c.getCurrentDiskUsage() != null && c.getCurrentDiskUsage() > 85.0)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ComputerDto findComputerByNameOrId(String nameOrId) {
        if (nameOrId == null || nameOrId.trim().isEmpty()) return null;
        String query = nameOrId.trim().toLowerCase();

        return computerService.getAllComputers().stream()
                .filter(c -> c.getHostname().toLowerCase().contains(query) ||
                             (c.getComputerName() != null && c.getComputerName().toLowerCase().contains(query)) ||
                             c.getId().equalsIgnoreCase(query))
                .findFirst()
                .orElse(null);
    }
}
