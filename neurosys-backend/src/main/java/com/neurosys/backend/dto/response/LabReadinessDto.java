package com.neurosys.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabReadinessDto {
    private String labName;
    private int totalComputers;
    private int readyComputers;
    private int unreadyComputers;
    private double readinessPercentage;
    private List<LabComputerStatusDto> computers;
    private List<String> requiredSoftwareNames;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LabComputerStatusDto {
        private String computerId;
        private String hostname;
        private String status;
        private boolean ready;
        private List<String> missingSoftware;
        private List<String> outdatedSoftware;
        private List<String> issues;
    }
}
