package com.travelai.careers;

import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "job_positions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobPosition {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String location;

    @Column(name = "employment_type", nullable = false)
    private String employmentType;

    @Column(name = "apply_email", nullable = false)
    @Builder.Default
    private String applyEmail = "careers@travelai.com";

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
