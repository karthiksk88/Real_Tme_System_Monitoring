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

    @Column(name = "predicted_issue")
    private String predictedIssue;

    @Column(name = "estimated_timeframe")
    private String estimatedTimeframe;

    @Column(name = "risk_level")
    private String riskLevel;

    @Column(name = "model_version")
    private String modelVersion;

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

    @Column(name = "contributing_factors_json", columnDefinition = "TEXT")
    private String contributingFactorsJson;

    @Column(name = "historical_graph_json", columnDefinition = "TEXT")
    private String historicalGraphJson;

    @Column(name = "predicted_graph_json", columnDefinition = "TEXT")
    private String predictedGraphJson;

    @Column(name = "recommended_action", columnDefinition = "TEXT")
    private String recommendedAction;

    @Column(name = "data_start_date")
    private Instant dataStartDate;

    @Column(name = "data_end_date")
    private Instant dataEndDate;

    @Column(name = "predicted_at")
    @Builder.Default
    private Instant predictedAt = Instant.now();
}
