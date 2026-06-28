package com.travelai.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
            String targetType, UUID targetId, Pageable pageable);

    Page<Review> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByTargetTypeAndTargetId(String targetType, UUID targetId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.targetType = :targetType AND r.targetId = :targetId")
    Optional<Double> findAverageRatingByTarget(
            @Param("targetType") String targetType,
            @Param("targetId") UUID targetId);

    boolean existsByUserIdAndTargetTypeAndTargetId(UUID userId, String targetType, UUID targetId);

    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
