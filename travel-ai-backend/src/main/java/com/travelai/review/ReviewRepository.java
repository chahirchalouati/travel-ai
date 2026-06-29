package com.travelai.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
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

    @Query("SELECT AVG(r.rating) FROM Review r")
    Optional<Double> findGlobalAverageRating();

    /** Per-aspect averages for a single target (nulls ignored by AVG). */
    @Query("""
            SELECT AVG(r.ratingService), AVG(r.ratingValue),
                   AVG(r.ratingCleanliness), AVG(r.ratingLocation)
            FROM Review r
            WHERE r.targetType = :targetType AND r.targetId = :targetId
            """)
    Object[] findAspectAverages(
            @Param("targetType") String targetType,
            @Param("targetId") UUID targetId);

    /** Aggregate count + average rating per target within a type, for ranking. */
    @Query("""
            SELECT r.targetId AS targetId, COUNT(r) AS reviewCount, AVG(r.rating) AS avgRating
            FROM Review r
            WHERE r.targetType = :targetType
            GROUP BY r.targetId
            """)
    List<TargetRatingAggregate> aggregateByType(@Param("targetType") String targetType);

    interface TargetRatingAggregate {
        UUID getTargetId();
        long getReviewCount();
        double getAvgRating();
    }
}
