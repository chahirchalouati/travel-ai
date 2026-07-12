package com.travelai.forum;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "forum_questions")
@Getter
@Setter
public class ForumQuestion extends BaseEntity {

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    /** Optional link to a catalog entity, e.g. DESTINATION / ATTRACTION / HOTEL. */
    @Column(name = "target_type")
    private String targetType;

    @Column(name = "target_id")
    private UUID targetId;

    /** Optional free-text location (city / region). */
    private String location;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "answer_count", nullable = false)
    private int answerCount = 0;
}
