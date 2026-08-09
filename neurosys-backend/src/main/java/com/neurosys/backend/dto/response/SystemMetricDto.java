package com.neurosys.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemMetricDto {
    private Long id;
    private String computerId;
    private String hostname;
    private Double cpuUsagePercent;
    private Double memoryUsagePercent;
    private Double memoryUsedMb;
    private Double memoryFreeMb;
    private Double diskUsagePercent;
    private Double diskUsedGb;
    private Double diskFreeGb;
    private Double diskReadBytesSec;
    private Double diskWriteBytesSec;
    private Double networkRxBytesSec;
    private Double networkTxBytesSec;
    private Double cpuTemperature;
    private Integer activeProcessCount;
    private Instant recordedAt;
}
