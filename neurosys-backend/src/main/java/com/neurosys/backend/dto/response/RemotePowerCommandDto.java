package com.neurosys.backend.dto.response;

import com.neurosys.backend.enums.PowerCommandStatus;
import com.neurosys.backend.enums.PowerCommandType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemotePowerCommandDto {
    private String id;
    private String computerId;
    private String computerName;
    private PowerCommandType commandType;
    private PowerCommandStatus status;
    private String requestedBy;
    private String failureReason;
    private Instant createdAt;
    private Instant updatedAt;
}
