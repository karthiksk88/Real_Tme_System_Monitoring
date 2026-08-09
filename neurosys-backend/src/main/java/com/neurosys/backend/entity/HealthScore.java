package com.neurosys.backend.entity;

import com.neurosys.backend.enums.HealthCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "health_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthScore extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "computer_id", nullable = false)
    private Computer computer;

    @Column(name = "overall_score", nullable = false)
    private Double overallScore;

    @Column(name = "cpu_health")
    private Double cpuHealth;

    @Column(name = "memory_health")
    private Double memoryHealth;

    @Column(name = "disk_health")
    private Double diskHealth;

    @Column(name = "network_health")
    private Double networkHealth;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private HealthCategory category;

    @Column(name = "calculated_at")
    @Builder.Default
    private Instant calculatedAt = Instant.now();
}
