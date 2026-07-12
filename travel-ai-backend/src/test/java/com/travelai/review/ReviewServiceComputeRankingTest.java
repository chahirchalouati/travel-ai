package com.travelai.review;

import com.travelai.review.dto.ReviewSummary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReviewService.computeRanking()")
class ReviewServiceComputeRankingTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ReviewHelpfulVoteRepository helpfulVoteRepository;

    @Mock
    private com.travelai.auth.UserRepository userRepository;

    @Mock
    private com.travelai.booking.BookingRepository bookingRepository;

    @Mock
    private ChatClient chatClient;

    @InjectMocks
    private ReviewService reviewService;

    private static final String TARGET_TYPE = "HOTEL";
    private final UUID targetId = UUID.randomUUID();

    /** Minimal stub so getReviewSummary() reaches computeRanking() without NPE. */
    @BeforeEach
    void stubCommonQueries() {
        when(reviewRepository.findAverageRatingByTarget(TARGET_TYPE, targetId))
                .thenReturn(Optional.of(0.0));
        when(reviewRepository.countByTargetTypeAndTargetId(TARGET_TYPE, targetId))
                .thenReturn(0L);
        when(reviewRepository.findAspectAverages(TARGET_TYPE, targetId))
                .thenReturn(null);
        // No recent reviews — AI summary returns "No reviews yet."
        when(reviewRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                eq(TARGET_TYPE), eq(targetId), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));
    }

    @Nested
    @DisplayName("when no aggregates exist for the target type")
    class NoAggregates {

        @BeforeEach
        void stubEmpty() {
            when(reviewRepository.aggregateByType(TARGET_TYPE)).thenReturn(List.of());
        }

        @Test
        @DisplayName("ranking is not null")
        void ranking_isNotNull() {
            ReviewSummary summary = reviewService.getReviewSummary(TARGET_TYPE, targetId);

            assertThat(summary.ranking()).isNotNull();
        }

        @Test
        @DisplayName("ranking has rank 0 (unranked sentinel)")
        void ranking_rankIsZero() {
            ReviewSummary summary = reviewService.getReviewSummary(TARGET_TYPE, targetId);

            assertThat(summary.ranking().rank()).isZero();
        }

        @Test
        @DisplayName("ranking has rankTotal 0")
        void ranking_rankTotalIsZero() {
            ReviewSummary summary = reviewService.getReviewSummary(TARGET_TYPE, targetId);

            assertThat(summary.ranking().rankTotal()).isZero();
        }

        @Test
        @DisplayName("ranking score is 0.0")
        void ranking_scoreIsZero() {
            ReviewSummary summary = reviewService.getReviewSummary(TARGET_TYPE, targetId);

            assertThat(summary.ranking().score()).isZero();
        }
    }

    @Nested
    @DisplayName("when aggregates exist but none belong to this target (target has no reviews)")
    class AggregatesPresentButTargetAbsent {

        private final UUID otherTarget = UUID.randomUUID();

        @BeforeEach
        void stubOnePeer() {
            ReviewRepository.TargetRatingAggregate peer = new ReviewRepository.TargetRatingAggregate() {
                @Override public UUID getTargetId()    { return otherTarget; }
                @Override public long getReviewCount() { return 3L; }
                @Override public double getAvgRating() { return 4.5; }
            };
            when(reviewRepository.aggregateByType(TARGET_TYPE)).thenReturn(List.of(peer));
        }

        @Test
        @DisplayName("ranking is not null")
        void ranking_isNotNull() {
            ReviewSummary summary = reviewService.getReviewSummary(TARGET_TYPE, targetId);

            assertThat(summary.ranking()).isNotNull();
        }

        @Test
        @DisplayName("ranking has rank 0 (unranked sentinel)")
        void ranking_rankIsZero() {
            ReviewSummary summary = reviewService.getReviewSummary(TARGET_TYPE, targetId);

            assertThat(summary.ranking().rank()).isZero();
        }

        @Test
        @DisplayName("rankTotal reflects the number of ranked peers")
        void ranking_rankTotalReflectsPeerCount() {
            ReviewSummary summary = reviewService.getReviewSummary(TARGET_TYPE, targetId);

            assertThat(summary.ranking().rankTotal()).isEqualTo(1L);
        }
    }

    @Nested
    @DisplayName("when this target has reviews and is in the aggregate list")
    class TargetRanked {

        @BeforeEach
        void stubTargetAndPeer() {
            UUID peer = UUID.randomUUID();
            ReviewRepository.TargetRatingAggregate aggTarget = new ReviewRepository.TargetRatingAggregate() {
                @Override public UUID getTargetId()    { return targetId; }
                @Override public long getReviewCount() { return 5L; }
                @Override public double getAvgRating() { return 4.8; }
            };
            ReviewRepository.TargetRatingAggregate aggPeer = new ReviewRepository.TargetRatingAggregate() {
                @Override public UUID getTargetId()    { return peer; }
                @Override public long getReviewCount() { return 2L; }
                @Override public double getAvgRating() { return 3.0; }
            };
            when(reviewRepository.aggregateByType(TARGET_TYPE)).thenReturn(List.of(aggTarget, aggPeer));
        }

        @Test
        @DisplayName("rank is 1-based and positive")
        void ranking_rankIsPositive() {
            ReviewSummary summary = reviewService.getReviewSummary(TARGET_TYPE, targetId);

            assertThat(summary.ranking().rank()).isPositive();
        }

        @Test
        @DisplayName("high-rated target ranks first (rank == 1)")
        void ranking_topRatedIsRankOne() {
            ReviewSummary summary = reviewService.getReviewSummary(TARGET_TYPE, targetId);

            assertThat(summary.ranking().rank()).isEqualTo(1);
        }

        @Test
        @DisplayName("rankTotal equals aggregate list size")
        void ranking_rankTotalEqualsAggregateSize() {
            ReviewSummary summary = reviewService.getReviewSummary(TARGET_TYPE, targetId);

            assertThat(summary.ranking().rankTotal()).isEqualTo(2L);
        }
    }
}
