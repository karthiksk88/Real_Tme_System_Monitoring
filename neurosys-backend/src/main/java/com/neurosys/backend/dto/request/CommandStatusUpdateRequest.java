package com.neurosys.backend.dto.request;

import com.neurosys.backend.enums.PowerCommandStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommandStatusUpdateRequest {
    private String commandId;
    private String agentId;
    private PowerCommandStatus status;
    private String failureReason;
}
