package com.neurosys.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "required_software")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequiredSoftware extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "lab_name", nullable = false, length = 100)
    private String labName;

    @Column(name = "software_name", nullable = false, length = 200)
    private String softwareName;

    @Column(name = "required_version", length = 100)
    private String requiredVersion;
}
