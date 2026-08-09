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
public class AnalyticsSummaryDto {
    private long totalComputers;
    private long onlineComputers;
    private long offlineComputers;
    private long warningComputers;
    private long criticalComputers;
    private Double averageCpuUsage;
    private Double averageRamUsage;
    private Double averageDiskUsage;
    private Double averageNetworkThroughput;
    private ComputerDto topBusyComputer;
    private ComputerDto topHealthyComputer;
    private long activeAlertsCount;
    private Map<String, Long> alertSeverityBreakdown;
    private List<ComputerDto> highRiskCrashComputers;
}
