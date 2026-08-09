package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.ProcessMonitoringResponse;

public interface ProcessMonitoringService {
    ProcessMonitoringResponse getComputerProcesses(String computerId, String search, String sortBy, String sortOrder, int page, int size);
}
