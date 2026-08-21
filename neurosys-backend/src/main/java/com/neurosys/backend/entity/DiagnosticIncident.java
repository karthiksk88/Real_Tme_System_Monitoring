package com.neurosys.backend.entity;

import com.neurosys.backend.enums.ConfirmationStatus;
import com.neurosys.backend.enums.DiagnosticCategory;
import com.neurosys.backend.enums.IncidentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "diagnostic_incidents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiagnosticIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "computer_id", nullable = false)
    private Computer computer;

    @Column(name = "problem_title", nullable = false)
    private String problemTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private DiagnosticCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "confirmation_status", nullable = false)
    private ConfirmationStatus confirmationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "incident_status", nullable = false)
    private IncidentStatus incidentStatus;

    @Column(name = "exact_reason", length = 1000)
    private String exactReason;

    @Column(name = "evidence_json", columnDefinition = "TEXT")
    private String evidenceJson;

    @Column(name = "solution", length = 1000)
    private String solution;

    @Column(name = "possible_causes_json", columnDefinition = "TEXT")
    private String possibleCausesJson;

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @PrePersist
    protected void onCreate() {
        if (this.detectedAt == null) {
            this.detectedAt = Instant.now();
        }
        this.lastSeenAt = Instant.now();
        if (this.incidentStatus == null) {
            this.incidentStatus = IncidentStatus.ACTIVE;
        }
    }
}
