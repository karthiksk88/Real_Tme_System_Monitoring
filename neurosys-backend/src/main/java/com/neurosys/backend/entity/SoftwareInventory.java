package com.neurosys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "software_inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoftwareInventory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "computer_id", nullable = false)
    private Computer computer;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "version", length = 100)
    private String version;

    @Column(name = "publisher", length = 150)
    private String publisher;

    @Column(name = "install_date", length = 50)
    private String installDate;

    @Column(name = "last_scanned_at")
    @Builder.Default
    private Instant lastScannedAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (this.getCreatedAt() == null) {
            this.setCreatedAt(Instant.now());
        }
        if (this.getUpdatedAt() == null) {
            this.setUpdatedAt(Instant.now());
        }
        if (this.lastScannedAt == null) {
            this.lastScannedAt = Instant.now();
        }
    }
}
