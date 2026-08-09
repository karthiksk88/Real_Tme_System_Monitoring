package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.FileAnalysisReportDto;

public interface FileAnalyzerService {
    FileAnalysisReportDto scanComputerFiles(String computerId);
}
