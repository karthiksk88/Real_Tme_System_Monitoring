package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.AnalyticsSummaryDto;
import com.neurosys.backend.dto.response.ComputerDto;
import com.neurosys.backend.enums.AlertSeverity;
import com.neurosys.backend.enums.AlertStatus;
import com.neurosys.backend.enums.ComputerStatus;
import com.neurosys.backend.repository.AlertRepository;
import com.neurosys.backend.repository.ComputerRepository;
import com.neurosys.backend.repository.SystemMetricRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ComputerRepository computerRepository;
    private final SystemMetricRepository systemMetricRepository;
    private final AlertRepository alertRepository;
    private final ComputerService computerService;

    @Override
    @Transactional(readOnly = true)
    public AnalyticsSummaryDto getExecutiveAnalyticsSummary() {
        long total = computerRepository.count();
        long online = computerRepository.countByStatus(ComputerStatus.ONLINE);
        long offline = computerRepository.countByStatus(ComputerStatus.OFFLINE);
        long warning = computerRepository.countByStatus(ComputerStatus.WARNING);
        long critical = computerRepository.countByStatus(ComputerStatus.CRITICAL);

        Double avgCpu = systemMetricRepository.findFleetAverageCpuUsage();
        Double avgRam = systemMetricRepository.findFleetAverageMemoryUsage();
        Double avgDisk = systemMetricRepository.findFleetAverageDiskUsage();
        Double avgNet = systemMetricRepository.findFleetAverageNetworkThroughput();

        List<ComputerDto> allComputers = computerService.getAllComputers();
        ComputerDto topBusy = allComputers.stream()
                .max((c1, c2) -> Double.compare(c1.getCurrentCpuUsage() != null ? c1.getCurrentCpuUsage() : 0.0,
                                               c2.getCurrentCpuUsage() != null ? c2.getCurrentCpuUsage() : 0.0))
                .orElse(null);

        ComputerDto topHealthy = allComputers.stream()
                .max((c1, c2) -> Double.compare(c1.getCurrentHealthScore() != null ? c1.getCurrentHealthScore() : 0.0,
                                               c2.getCurrentHealthScore() != null ? c2.getCurrentHealthScore() : 0.0))
                .orElse(null);

        Map<String, Long> alertBreakdown = new HashMap<>();
        alertBreakdown.put("INFO", alertRepository.countBySeverity(AlertSeverity.INFO));
        alertBreakdown.put("WARNING", alertRepository.countBySeverity(AlertSeverity.WARNING));
        alertBreakdown.put("CRITICAL", alertRepository.countBySeverity(AlertSeverity.CRITICAL));

        long activeAlerts = alertRepository.countByStatus(AlertStatus.OPEN);

        List<ComputerDto> highRisk = allComputers.stream()
                .filter(c -> "CRITICAL".equalsIgnoreCase(c.getStatus()) || (c.getCurrentCpuUsage() != null && c.getCurrentCpuUsage() > 85.0))
                .toList();

        return AnalyticsSummaryDto.builder()
                .totalComputers(total)
                .onlineComputers(online)
                .offlineComputers(offline)
                .warningComputers(warning)
                .criticalComputers(critical)
                .averageCpuUsage(avgCpu != null ? Math.round(avgCpu * 10.0) / 10.0 : 0.0)
                .averageRamUsage(avgRam != null ? Math.round(avgRam * 10.0) / 10.0 : 0.0)
                .averageDiskUsage(avgDisk != null ? Math.round(avgDisk * 10.0) / 10.0 : 0.0)
                .averageNetworkThroughput(avgNet != null ? Math.round(avgNet * 10.0) / 10.0 : 0.0)
                .topBusyComputer(topBusy)
                .topHealthyComputer(topHealthy)
                .activeAlertsCount(activeAlerts)
                .alertSeverityBreakdown(alertBreakdown)
                .highRiskCrashComputers(highRisk)
                .build();
    }
}
