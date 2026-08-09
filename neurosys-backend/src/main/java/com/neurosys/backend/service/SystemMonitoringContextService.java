package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.ComputerDto;

import java.util.List;

public interface SystemMonitoringContextService {
    List<ComputerDto> getOfflineComputers();
    List<ComputerDto> getTopCpuComputers();
    List<ComputerDto> getLowDiskComputers();
    ComputerDto findComputerByNameOrId(String nameOrId);
}
