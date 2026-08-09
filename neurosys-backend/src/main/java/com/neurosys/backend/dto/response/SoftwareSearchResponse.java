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
public class SoftwareSearchResponse {
    private String query;
    private String matchedSoftware;
    private boolean softwareFound;
    private int totalComputers;
    private int installedCount;
    private int notInstalledCount;
    private List<String> suggestions;
    private List<ComputerSoftwareStatusDto> computers;

    // Backward compatibility fields
    private String softwareName;
    private int totalInstalled;
    private int totalMissing;
    private int totalOutdated;
    private List<InstalledComputerInfo> installedComputers;
    private List<MissingComputerInfo> missingComputers;
    private List<OutdatedComputerInfo> outdatedComputers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComputerSoftwareStatusDto {
        private String computerId;
        private String computerName;
        private String hostname;
        private String labName;
        private String status;
        private boolean installed;
        private String version;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstalledComputerInfo {
        private String computerId;
        private String hostname;
        private String labName;
        private String version;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MissingComputerInfo {
        private String computerId;
        private String hostname;
        private String labName;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OutdatedComputerInfo {
        private String computerId;
        private String hostname;
        private String labName;
        private String currentVersion;
        private String requiredVersion;
        private String status;
    }
}
