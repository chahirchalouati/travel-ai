package com.travelai.forum;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ForumQuestionRepository extends JpaRepository<ForumQuestion, UUID> {

    Page<ForumQuestion> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ForumQuestion> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
            String targetType, UUID targetId, Pageable pageable);

    Page<ForumQuestion> findByTitleContainingIgnoreCaseOrBodyContainingIgnoreCaseOrderByCreatedAtDesc(
            String title, String body, Pageable pageable);
}
