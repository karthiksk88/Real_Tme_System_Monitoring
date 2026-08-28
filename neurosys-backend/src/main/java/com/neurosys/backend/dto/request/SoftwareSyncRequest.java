package com.neurosys.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SoftwareSyncRequest {

    @NotBlank(message = "Agent ID is required")
    private String agentId;

    private String hostname;

    private List<SoftwareItemDto> softwareList;
}
