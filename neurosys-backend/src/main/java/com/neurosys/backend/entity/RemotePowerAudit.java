package com.neurosys.backend.entity;

import com.neurosys.backend.enums.PowerCommandType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "remote_power_audits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RemotePowerAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(name = "computer_name", nullable = false)
    private String computerName;

    @Column(name = "computer_id", nullable = false)
    private String computerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    private PowerCommandType action;

    @Column(name = "timestamp", nullable = false, updatable = false)
    @Builder.Default
    private Instant timestamp = Instant.now();

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "failure_reason")
    private String failureReason;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }
}
