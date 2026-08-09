package com.neurosys.backend.entity;

import com.neurosys.backend.enums.LogLevel;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "computer_id", nullable = false)
    private Computer computer;

    @Column(name = "event_id")
    private Integer eventId;

    @Column(name = "provider_name", length = 150)
    private String providerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "log_level", nullable = false, length = 50)
    private LogLevel logLevel;

    @Column(name = "source_component", length = 100)
    private String sourceComponent;

    @Column(name = "raw_message", columnDefinition = "TEXT")
    private String rawMessage;

    @Column(name = "simplified_english", columnDefinition = "TEXT")
    private String simplifiedEnglish;

    @Column(name = "suggested_solution", columnDefinition = "TEXT")
    private String suggestedSolution;

    @Column(name = "timestamp")
    @Builder.Default
    private Instant timestamp = Instant.now();
}
