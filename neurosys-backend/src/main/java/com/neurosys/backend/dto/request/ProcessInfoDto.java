package com.neurosys.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessInfoDto {
    private int pid;
    private String processName;
    private Double cpuPercent;
    private Double memoryPercent;
    private Double memoryUsedMb;
    private String status;
    private String user;
}
