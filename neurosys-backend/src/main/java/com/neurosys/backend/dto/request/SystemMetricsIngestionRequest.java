package com.neurosys.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemMetricsIngestionRequest {

    @NotBlank(message = "Agent ID is required")
    private String agentId;

    @NotNull(message = "CPU Usage is required")
    @DecimalMin(value = "0.0", message = "CPU usage cannot be negative")
    @DecimalMax(value = "100.0", message = "CPU usage cannot exceed 100%")
    private Double cpuUsagePercent;

    @NotNull(message = "RAM Usage is required")
    @DecimalMin(value = "0.0", message = "RAM usage cannot be negative")
    @DecimalMax(value = "100.0", message = "RAM usage cannot exceed 100%")
    private Double memoryUsagePercent;

    private Double memoryUsedMb;
    private Double memoryFreeMb;

    @NotNull(message = "Disk Usage is required")
    @DecimalMin(value = "0.0", message = "Disk usage cannot be negative")
    @DecimalMax(value = "100.0", message = "Disk usage cannot exceed 100%")
    private Double diskUsagePercent;

    private Double diskUsedGb;
    private Double diskFreeGb;

    private Double diskReadBytesSec;
    private Double diskWriteBytesSec;

    private Double networkRxBytesSec;
    private Double networkTxBytesSec;

    private Double cpuTemperature;
    private Integer activeProcessCount;
    private Long uptimeSeconds;
    private Boolean internetConnected;

    private List<ProcessInfoDto> topProcesses;

    @Builder.Default
    private Instant timestamp = Instant.now();
}
