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
        if (query != null && !query.isBlank()) {
            return questionRepository
                    .findByTitleContainingIgnoreCaseOrBodyContainingIgnoreCaseOrderByCreatedAtDesc(query, query, pageable)
                    .map(QuestionResponse::from);
        }
        if (targetType != null && !targetType.isBlank() && targetId != null) {
            return questionRepository
                    .findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId, pageable)
                    .map(QuestionResponse::from);
        }
        return questionRepository.findAllByOrderByCreatedAtDesc(pageable).map(QuestionResponse::from);
    }

    public QuestionDetailResponse getQuestion(UUID id) {
        ForumQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.FORUM_QUESTION_NOT_FOUND));
        var answers = answerRepository
                .findByQuestionIdOrderByAcceptedDescHelpfulCountDescCreatedAtAsc(id)
                .stream().map(AnswerResponse::from).toList();
        return new QuestionDetailResponse(QuestionResponse.from(question), answers);
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
        return QuestionResponse.from(saved);
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

        return AnswerResponse.from(saved);
    }

    @Transactional
    public AnswerResponse markAnswerHelpful(UUID answerId) {
        ForumAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.FORUM_ANSWER_NOT_FOUND));
        answer.setHelpfulCount(answer.getHelpfulCount() + 1);
        return AnswerResponse.from(answerRepository.save(answer));
    }

    // --- helpers ---

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
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
