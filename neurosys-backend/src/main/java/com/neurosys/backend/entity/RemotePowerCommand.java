package com.neurosys.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.neurosys.backend.enums.PowerCommandStatus;
import com.neurosys.backend.enums.PowerCommandType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "remote_power_commands")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RemotePowerCommand {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "computer_id", nullable = false)
    private Computer computer;

    @Enumerated(EnumType.STRING)
    @Column(name = "command_type", nullable = false)
    private PowerCommandType commandType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PowerCommandStatus status;

    @Column(name = "requested_by")
    private String requestedBy;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
