package com.travelai.forum.dto;

import com.travelai.forum.ForumAnswer;
import com.travelai.forum.ForumQuestion;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Request/response payloads for the community Q&A forum. */
public final class ForumDtos {

    private ForumDtos() {
    }

    public record AskQuestionRequest(
            @NotBlank String title,
            @NotBlank String body,
            String targetType,
            UUID targetId,
            String location
    ) {}

    public record AnswerRequest(
            @NotBlank String body
    ) {}

    public record QuestionResponse(
            UUID id,
            String authorName,
            String title,
            String body,
            String targetType,
            UUID targetId,
            String location,
            int answerCount,
            Instant createdAt
    ) {
        public static QuestionResponse from(ForumQuestion q) {
            return new QuestionResponse(
                    q.getId(), q.getAuthorName(), q.getTitle(), q.getBody(),
                    q.getTargetType(), q.getTargetId(), q.getLocation(),
                    q.getAnswerCount(), q.getCreatedAt());
        }
    }

    public record AnswerResponse(
            UUID id,
            String authorName,
            String body,
            int helpfulCount,
            boolean accepted,
            Instant createdAt
    ) {
        public static AnswerResponse from(ForumAnswer a) {
            return new AnswerResponse(
                    a.getId(), a.getAuthorName(), a.getBody(),
                    a.getHelpfulCount(), a.isAccepted(), a.getCreatedAt());
        }
    }

    public record QuestionDetailResponse(
            QuestionResponse question,
            List<AnswerResponse> answers
    ) {}
}
