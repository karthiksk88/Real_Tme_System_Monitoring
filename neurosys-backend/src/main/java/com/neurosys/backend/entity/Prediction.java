package com.neurosys.backend.entity;

import com.neurosys.backend.enums.PredictionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prediction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "computer_id", nullable = false)
    private Computer computer;

    @Enumerated(EnumType.STRING)
    @Column(name = "prediction_type", nullable = false, length = 50)
    private PredictionType predictionType;

    @Column(name = "horizon_minutes")
    private Integer horizonMinutes;

    @Column(name = "predicted_cpu")
    private Double predictedCpu;

    @Column(name = "predicted_ram")
    private Double predictedRam;

    @Column(name = "predicted_disk")
    private Double predictedDisk;

    @Column(name = "crash_probability")
    private Double crashProbability;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "reasons_json", columnDefinition = "TEXT")
    private String reasonsJson;

    @Column(name = "recommended_action", columnDefinition = "TEXT")
    private String recommendedAction;

    @Column(name = "predicted_at")
    @Builder.Default
    private Instant predictedAt = Instant.now();
}
