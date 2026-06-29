package com.travelai.forum;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "forum_answers")
@Getter
@Setter
public class ForumAnswer extends BaseEntity {

    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "helpful_count", nullable = false)
    private int helpfulCount = 0;

    @Column(nullable = false)
    private boolean accepted = false;
}
