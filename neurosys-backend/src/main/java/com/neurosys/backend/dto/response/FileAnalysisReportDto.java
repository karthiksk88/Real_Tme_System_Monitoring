package com.neurosys.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileAnalysisReportDto {
    private String computerId;
    private String hostname;
    private Double totalScannedSizeGb;
    private Double duplicateFilesSizeGb;
    private int duplicateFilesCount;
    private Double largeFilesSizeGb;
    private int largeFilesCount;
    private Double tempJunkFilesSizeGb;
    private int tempJunkFilesCount;
    private Map<String, Double> storageBreakdownGb;
    private List<String> optimizationSuggestions;
}
