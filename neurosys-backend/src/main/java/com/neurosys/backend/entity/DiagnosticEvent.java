package com.neurosys.backend.entity;

import com.neurosys.backend.enums.DiagnosticCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "diagnostic_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiagnosticEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "computer_id", nullable = false)
    private Computer computer;

    @Column(name = "event_source")
    private String eventSource;

    @Column(name = "event_id")
    private Integer eventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private DiagnosticCategory category;

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.occurredAt == null) {
            this.occurredAt = Instant.now();
        }
    }
}
