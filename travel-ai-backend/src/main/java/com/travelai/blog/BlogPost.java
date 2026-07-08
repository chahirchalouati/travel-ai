package com.travelai.blog;

import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "blog_posts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogPost {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String excerpt;

    @Column(nullable = false)
    private String category;

    @Column(name = "read_min", nullable = false)
    @Builder.Default
    private int readMin = 5;

    @Column(name = "date_label", nullable = false)
    private String dateLabel;

    private String icon;

    private String accent;

    @Column(nullable = false)
    @Builder.Default
    private boolean featured = false;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
