package com.travelai.review;

import com.travelai.auth.User;
import com.travelai.review.dto.CreateReviewRequest;
import com.travelai.review.dto.ReviewResponse;
import com.travelai.review.dto.ReviewSummary;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewResponse> createReview(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody CreateReviewRequest req) {
        UUID userId = ((User) user).getId();
        return ApiResponse.ok(reviewService.createReview(userId, req));
    }

    @GetMapping("/target/{targetType}/{targetId}")
    public ApiResponse<Page<ReviewResponse>> getReviewsForTarget(
            @PathVariable String targetType,
            @PathVariable UUID targetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(reviewService.getReviewsForTarget(targetType, targetId, page, size));
    }

    @GetMapping("/target/{targetType}/{targetId}/summary")
    public ApiResponse<ReviewSummary> getReviewSummary(
            @PathVariable String targetType,
            @PathVariable UUID targetId) {
        return ApiResponse.ok(reviewService.getReviewSummary(targetType, targetId));
    }

    @GetMapping("/recent")
    public ApiResponse<Page<ReviewResponse>> getRecentReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        return ApiResponse.ok(reviewService.getRecentReviews(page, size));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<Page<ReviewResponse>> getReviewsByUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(reviewService.getReviewsByUser(userId, page, size));
    }

    @PostMapping("/{reviewId}/helpful")
    public ApiResponse<ReviewResponse> markHelpful(@PathVariable UUID reviewId) {
        return ApiResponse.ok(reviewService.markHelpful(reviewId));
    }
}
