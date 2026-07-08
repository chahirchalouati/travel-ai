package com.travelai.sitecontent;

import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.UUID;

/**
 * Generic editorial content block for marketing site pages (about, partners,
 * developers). Each row is one item within a {@code section} of a {@code page};
 * the flexible columns cover the different shapes those sections need
 * (stats, value cards, partner types with bullet lists, API endpoints, SDKs).
 */
@Entity
@Table(name = "site_content_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteContentItem {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String page;

    @Column(nullable = false)
    private String section;

    @Column(columnDefinition = "text")
    private String title;

    @Column(columnDefinition = "text")
    private String body;

    private String icon;

    private String accent;

    /** Free-form scalar: stat value, step number, HTTP method, install command… */
    @Column(name = "value_text")
    private String value;

    /** Newline-separated bullet list (e.g. partner-type benefits). */
    @Column(columnDefinition = "text")
    private String bullets;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
