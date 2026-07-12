package com.travelai.forum;

import com.travelai.forum.dto.ForumDtos.AnswerRequest;
import com.travelai.forum.dto.ForumDtos.AnswerResponse;
import com.travelai.forum.dto.ForumDtos.AskQuestionRequest;
import com.travelai.forum.dto.ForumDtos.QuestionDetailResponse;
import com.travelai.forum.dto.ForumDtos.QuestionResponse;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/forum")
@RequiredArgsConstructor
public class ForumController {

    private static final int MAX_SIZE = 50;

    private final ForumService forumService;

    @GetMapping("/questions")
    public ApiResponse<Page<QuestionResponse>> list(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) UUID targetId,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = size <= 0 ? 20 : Math.min(size, MAX_SIZE);
        return ApiResponse.ok(forumService.listQuestions(
                targetType, targetId, query, PageRequest.of(Math.max(page, 0), safeSize)));
    }

    @GetMapping("/questions/{id}")
    public ApiResponse<QuestionDetailResponse> get(@PathVariable UUID id) {
        return ApiResponse.ok(forumService.getQuestion(id));
    }

    @PostMapping("/questions")
    public ApiResponse<QuestionResponse> ask(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody AskQuestionRequest req) {
        return ApiResponse.ok(forumService.askQuestion(user.getUsername(), req));
    }

    @PostMapping("/questions/{id}/answers")
    public ApiResponse<AnswerResponse> answer(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id,
            @Valid @RequestBody AnswerRequest req) {
        return ApiResponse.ok(forumService.answerQuestion(user.getUsername(), id, req));
    }

    @PostMapping("/answers/{id}/helpful")
    public ApiResponse<AnswerResponse> markHelpful(@PathVariable UUID id) {
        return ApiResponse.ok(forumService.markAnswerHelpful(id));
    }
}
