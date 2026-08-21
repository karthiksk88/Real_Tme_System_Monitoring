package com.neurosys.backend.dto.request;

import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosticEventDto {
    private String eventSource;
    private Integer eventId;
    private String category; // GRAPHICS, STORAGE, SYSTEM_CRASH, UNEXPECTED_SHUTDOWN, APPLICATION
    private String message;
    private Instant occurredAt;
}
