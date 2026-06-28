package com.travelai.review;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
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

import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ChatClient chatClient;

    private static final int AI_SUMMARY_REVIEW_LIMIT = 20;

    @Transactional
    public ReviewResponse createReview(UUID userId, CreateReviewRequest req) {
        if (reviewRepository.existsByUserIdAndTargetTypeAndTargetId(userId, req.targetType(), req.targetId())) {
            throw TravelAiException.conflict(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));

        Review review = Review.builder()
                .user(user)
                .targetType(req.targetType())
                .targetId(req.targetId())
                .rating(req.rating())
                .title(req.title())
                .content(req.content())
                .photoUrls(req.photoUrls())
                .build();

        Review saved = reviewRepository.save(review);
        return ReviewResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsForTarget(String targetType, UUID targetId, int page, int size) {
        return reviewRepository
                .findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId, PageRequest.of(page, size))
                .map(ReviewResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsByUser(UUID userId, int page, int size) {
        return reviewRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(ReviewResponse::from);
    }

    @Transactional
    public ReviewResponse markHelpful(UUID reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.REVIEW_NOT_FOUND));

        review.setHelpfulCount(review.getHelpfulCount() + 1);
        Review saved = reviewRepository.save(review);
        return ReviewResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public ReviewSummary getReviewSummary(String targetType, UUID targetId) {
        double averageRating = reviewRepository.findAverageRatingByTarget(targetType, targetId)
                .orElse(0.0);
        long totalReviews = reviewRepository.countByTargetTypeAndTargetId(targetType, targetId);

        String aiSummary = generateAiSummary(targetType, targetId);

        return new ReviewSummary(targetType, targetId, averageRating, totalReviews, aiSummary);
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
