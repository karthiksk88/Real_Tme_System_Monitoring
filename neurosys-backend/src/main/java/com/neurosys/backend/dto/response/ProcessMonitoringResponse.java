package com.neurosys.backend.dto.response;

import com.neurosys.backend.dto.request.ProcessInfoDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessMonitoringResponse {
    private String computerId;
    private String hostname;
    private int totalProcessesCount;
    private List<ProcessInfoDto> topCpuProcesses;
    private List<ProcessInfoDto> topRamProcesses;
    private List<ProcessInfoDto> processes;
    private int currentPage;
    private int totalPages;
}
