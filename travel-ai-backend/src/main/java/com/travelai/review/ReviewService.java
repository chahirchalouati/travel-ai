package com.travelai.review;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.booking.BookingRepository;
import com.travelai.review.dto.CreateReviewRequest;
import com.travelai.review.dto.ReviewResponse;
import com.travelai.review.dto.ReviewSummary;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewHelpfulVoteRepository helpfulVoteRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ChatClient chatClient;

    private static final int AI_SUMMARY_REVIEW_LIMIT = 20;
    // Bayesian prior: how many "average" votes a target is weighted toward before its own score dominates.
    private static final double RANKING_PRIOR_WEIGHT = 5.0;
    private static final double DEFAULT_RATING = 3.5;

    @Transactional
    public ReviewResponse createReview(UUID userId, CreateReviewRequest req) {
        if (reviewRepository.existsByUserIdAndTargetTypeAndTargetId(userId, req.targetType(), req.targetId())) {
            throw TravelAiException.conflict(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));

        boolean verifiedStay = bookingRepository.existsConfirmedBookingForTarget(userId, req.targetId());

        Review review = Review.builder()
                .user(user)
                .targetType(req.targetType())
                .targetId(req.targetId())
                .rating(req.rating())
                .ratingService(req.ratingService())
                .ratingValue(req.ratingValue())
                .ratingCleanliness(req.ratingCleanliness())
                .ratingLocation(req.ratingLocation())
                .title(req.title())
                .content(req.content())
                .photoUrls(req.photoUrls())
                .verified(verifiedStay)
                .build();

        Review saved = reviewRepository.save(review);
        return ReviewResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsForTarget(
            String targetType, UUID targetId, int page, int size, UUID viewerId) {
        Page<Review> reviews = reviewRepository
                .findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId, PageRequest.of(page, size));
        return mapWithViewerVotes(reviews, viewerId);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsByUser(UUID userId, int page, int size) {
        return reviewRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(ReviewResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getRecentReviews(int page, int size) {
        return reviewRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                .map(ReviewResponse::from);
    }

    /**
     * Toggles the current user's "helpful" vote on a review. One vote per user; calling
     * again removes it. Returns the updated review reflecting the viewer's vote state.
     */
    @Transactional
    public ReviewResponse markHelpful(UUID reviewId, UUID userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.REVIEW_NOT_FOUND));

        boolean helpfulByMe;
        var existing = helpfulVoteRepository.findByReviewIdAndUserId(reviewId, userId);
        if (existing.isPresent()) {
            helpfulVoteRepository.delete(existing.get());
            helpfulByMe = false;
        } else {
            helpfulVoteRepository.save(ReviewHelpfulVote.builder()
                    .reviewId(reviewId)
                    .userId(userId)
                    .build());
            helpfulByMe = true;
        }

        review.setHelpfulCount((int) helpfulVoteRepository.countByReviewId(reviewId));
        Review saved = reviewRepository.save(review);
        return ReviewResponse.from(saved, helpfulByMe);
    }

    @Transactional(readOnly = true)
    public ReviewSummary getReviewSummary(String targetType, UUID targetId) {
        double averageRating = reviewRepository.findAverageRatingByTarget(targetType, targetId)
                .orElse(0.0);
        long totalReviews = reviewRepository.countByTargetTypeAndTargetId(targetType, targetId);

        Object[] aspects = reviewRepository.findAspectAverages(targetType, targetId);
        // Hibernate returns a single-row Object[] wrapped in an outer Object[] for tuple projections.
        Object[] row = (aspects != null && aspects.length == 1 && aspects[0] instanceof Object[] inner)
                ? inner : aspects;

        ReviewSummary.Ranking ranking = computeRanking(targetType, targetId);
        String aiSummary = generateAiSummary(targetType, targetId);

        return new ReviewSummary(
                targetType,
                targetId,
                averageRating,
                totalReviews,
                asDouble(row, 0),
                asDouble(row, 1),
                asDouble(row, 2),
                asDouble(row, 3),
                ranking,
                aiSummary);
    }

    private Page<ReviewResponse> mapWithViewerVotes(Page<Review> reviews, UUID viewerId) {
        if (viewerId == null || reviews.isEmpty()) {
            return reviews.map(ReviewResponse::from);
        }
        List<UUID> reviewIds = reviews.getContent().stream().map(Review::getId).toList();
        Set<UUID> votedIds = helpfulVoteRepository.findByUserIdAndReviewIdIn(viewerId, reviewIds).stream()
                .map(ReviewHelpfulVote::getReviewId)
                .collect(Collectors.toSet());
        return reviews.map(r -> ReviewResponse.from(r, votedIds.contains(r.getId())));
    }

    private ReviewSummary.Ranking computeRanking(String targetType, UUID targetId) {
        List<ReviewRepository.TargetRatingAggregate> aggregates = reviewRepository.aggregateByType(targetType);
        if (aggregates.isEmpty()) {
            // No reviews exist for this target type at all — target is not yet ranked.
            return ReviewSummary.Ranking.empty();
        }

        long totalVotes = aggregates.stream().mapToLong(ReviewRepository.TargetRatingAggregate::getReviewCount).sum();
        double globalMean = totalVotes == 0
                ? DEFAULT_RATING
                : aggregates.stream()
                        .mapToDouble(a -> a.getAvgRating() * a.getReviewCount())
                        .sum() / totalVotes;

        record Scored(UUID targetId, double score) {}
        List<Scored> ranked = aggregates.stream()
                .map(a -> new Scored(a.getTargetId(), bayesianScore(a.getReviewCount(), a.getAvgRating(), globalMean)))
                .sorted(Comparator.comparingDouble(Scored::score).reversed())
                .toList();

        for (int i = 0; i < ranked.size(); i++) {
            if (ranked.get(i).targetId().equals(targetId)) {
                return new ReviewSummary.Ranking(i + 1, ranked.size(), ranked.get(i).score());
            }
        }

        // This target has no reviews yet while other targets of the same type do —
        // return an "unranked" sentinel showing how many peers are ranked.
        return ReviewSummary.Ranking.unranked(ranked.size());
    }

    private double bayesianScore(long count, double avg, double globalMean) {
        return (count / (count + RANKING_PRIOR_WEIGHT)) * avg
                + (RANKING_PRIOR_WEIGHT / (count + RANKING_PRIOR_WEIGHT)) * globalMean;
    }

    private Double asDouble(Object[] row, int index) {
        if (row == null || index >= row.length || row[index] == null) {
            return null;
        }
        return ((Number) row[index]).doubleValue();
    }

    private String generateAiSummary(String targetType, UUID targetId) {
        Page<Review> recentReviews = reviewRepository
                .findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                        targetType, targetId, PageRequest.of(0, AI_SUMMARY_REVIEW_LIMIT));

        if (recentReviews.isEmpty()) {
            return "No reviews yet.";
        }

        String reviewContents = recentReviews.getContent().stream()
                .map(r -> "Rating: " + r.getRating() + "/5 - " + (r.getContent() != null ? r.getContent() : ""))
                .collect(Collectors.joining("\n"));

        String prompt = String.format(
                "Summarize the following reviews for this %s in 2-3 sentences. " +
                "Be helpful and balanced.\n\n%s",
                targetType.toLowerCase(), reviewContents);

        try {
            return chatClient.prompt(prompt).call().content();
        } catch (Exception e) {
            log.warn("AI summary generation failed for {} {}: {}", targetType, targetId, e.getMessage());
            return "Unable to generate summary at this time.";
        }
    }
}
