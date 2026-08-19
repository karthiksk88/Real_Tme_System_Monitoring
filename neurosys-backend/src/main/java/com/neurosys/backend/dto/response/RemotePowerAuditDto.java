package com.neurosys.backend.dto.response;

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
public class RemotePowerAuditDto {
    private String id;
    private String userName;
    private String computerName;
    private String computerId;
    private PowerCommandType action;
    private Instant timestamp;
    private String status;
    private String failureReason;
}
