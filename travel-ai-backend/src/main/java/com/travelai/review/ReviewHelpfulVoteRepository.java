package com.travelai.review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface ReviewHelpfulVoteRepository extends JpaRepository<ReviewHelpfulVote, UUID> {

    Optional<ReviewHelpfulVote> findByReviewIdAndUserId(UUID reviewId, UUID userId);

    long countByReviewId(UUID reviewId);

    Set<ReviewHelpfulVote> findByUserIdAndReviewIdIn(UUID userId, Iterable<UUID> reviewIds);
}
