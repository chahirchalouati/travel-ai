package com.travelai.help;

import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "help_faqs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HelpFaq {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(nullable = false, columnDefinition = "text")
    private String question;

    @Column(nullable = false, columnDefinition = "text")
    private String answer;

    private String category;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
