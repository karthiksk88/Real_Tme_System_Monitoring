package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.LogAnalysisDto;
import com.neurosys.backend.entity.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LogHumanizerService {
    LogAnalysisDto ingestAndHumanizeLog(String computerId, Integer eventId, String providerName, String logLevel, String rawMessage);
    Page<LogAnalysisDto> getComputerLogs(String computerId, String logLevel, Pageable pageable);
}
