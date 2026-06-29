package com.travelai.forum;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ForumAnswerRepository extends JpaRepository<ForumAnswer, UUID> {

    List<ForumAnswer> findByQuestionIdOrderByAcceptedDescHelpfulCountDescCreatedAtAsc(UUID questionId);

    long countByQuestionId(UUID questionId);
}
