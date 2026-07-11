package com.travelai.forum;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.forum.dto.ForumDtos.AnswerRequest;
import com.travelai.forum.dto.ForumDtos.AnswerResponse;
import com.travelai.forum.dto.ForumDtos.AskQuestionRequest;
import com.travelai.forum.dto.ForumDtos.QuestionDetailResponse;
import com.travelai.forum.dto.ForumDtos.QuestionResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ForumService {

    private final ForumQuestionRepository questionRepository;
    private final ForumAnswerRepository answerRepository;
    private final UserRepository userRepository;

    public Page<QuestionResponse> listQuestions(String targetType, UUID targetId, String query, Pageable pageable) {
        Page<ForumQuestion> page;
        if (query != null && !query.isBlank()) {
            page = questionRepository
                    .findByTitleContainingIgnoreCaseOrBodyContainingIgnoreCaseOrderByCreatedAtDesc(query, query, pageable);
        } else if (targetType != null && !targetType.isBlank() && targetId != null) {
            page = questionRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId, pageable);
        } else {
            page = questionRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        Map<UUID, String> avatars = avatarsFor(page.getContent().stream().map(ForumQuestion::getAuthorId).toList());
        return page.map(q -> QuestionResponse.from(q, avatars.get(q.getAuthorId())));
    }

    public QuestionDetailResponse getQuestion(UUID id) {
        ForumQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.FORUM_QUESTION_NOT_FOUND));
        var answerEntities = answerRepository
                .findByQuestionIdOrderByAcceptedDescHelpfulCountDescCreatedAtAsc(id);
        List<UUID> authorIds = new ArrayList<>();
        authorIds.add(question.getAuthorId());
        answerEntities.forEach(a -> authorIds.add(a.getAuthorId()));
        Map<UUID, String> avatars = avatarsFor(authorIds);
        var answers = answerEntities.stream()
                .map(a -> AnswerResponse.from(a, avatars.get(a.getAuthorId())))
                .toList();
        return new QuestionDetailResponse(
                QuestionResponse.from(question, avatars.get(question.getAuthorId())), answers);
    }

    @Transactional
    public QuestionResponse askQuestion(String userEmail, AskQuestionRequest req) {
        User author = resolveUser(userEmail);
        ForumQuestion question = new ForumQuestion();
        question.setAuthorId(author.getId());
        question.setAuthorName(displayName(author));
        question.setTitle(req.title());
        question.setBody(req.body());
        question.setTargetType(blankToNull(req.targetType()));
        question.setTargetId(req.targetId());
        question.setLocation(blankToNull(req.location()));
        ForumQuestion saved = questionRepository.save(question);
        log.info("Forum question {} asked by {}", saved.getId(), author.getId());
        return QuestionResponse.from(saved, author.getAvatarUrl());
    }

    @Transactional
    public AnswerResponse answerQuestion(String userEmail, UUID questionId, AnswerRequest req) {
        ForumQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.FORUM_QUESTION_NOT_FOUND));
        User author = resolveUser(userEmail);

        ForumAnswer answer = new ForumAnswer();
        answer.setQuestionId(questionId);
        answer.setAuthorId(author.getId());
        answer.setAuthorName(displayName(author));
        answer.setBody(req.body());
        ForumAnswer saved = answerRepository.save(answer);

        question.setAnswerCount((int) answerRepository.countByQuestionId(questionId));
        questionRepository.save(question);

        return AnswerResponse.from(saved, author.getAvatarUrl());
    }

    @Transactional
    public AnswerResponse markAnswerHelpful(UUID answerId) {
        ForumAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.FORUM_ANSWER_NOT_FOUND));
        answer.setHelpfulCount(answer.getHelpfulCount() + 1);
        ForumAnswer saved = answerRepository.save(answer);
        return AnswerResponse.from(saved, avatarsFor(List.of(saved.getAuthorId())).get(saved.getAuthorId()));
    }

    // --- helpers ---

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
    }

    /** Batch-loads avatar URLs for the given author ids, keyed by user id (null values omitted). */
    private Map<UUID, String> avatarsFor(Collection<UUID> authorIds) {
        List<UUID> distinct = authorIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinct.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> avatars = new HashMap<>();
        for (User user : userRepository.findAllById(distinct)) {
            if (user.getAvatarUrl() != null) {
                avatars.put(user.getId(), user.getAvatarUrl());
            }
        }
        return avatars;
    }

    private String displayName(User user) {
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        String name = (first + " " + last).trim();
        return name.isEmpty() ? "Traveler" : name;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
