package com.travelai.press;

import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "press_coverage")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PressCoverage {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String outlet;

    @Column(nullable = false, columnDefinition = "text")
    private String headline;

    private String url;

    private String icon;

    @Column(name = "date_label", nullable = false)
    private String dateLabel;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
