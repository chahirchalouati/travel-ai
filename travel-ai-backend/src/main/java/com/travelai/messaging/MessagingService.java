package com.travelai.messaging;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.messaging.dto.ConversationResponse;
import com.travelai.messaging.dto.MessageResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Conversation inbox between a user and the platform. Newly started conversations
 * receive an automated support acknowledgement so the thread is never empty.
 */
@Service
@RequiredArgsConstructor
public class MessagingService {

    private static final String AUTO_REPLY =
            "Thanks for reaching out! A TravelAI specialist will reply shortly. "
                    + "In the meantime, you can explore stays, flights and AI itineraries from your dashboard.";

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ConversationResponse> listConversations(String email) {
        UUID userId = userId(email);
        return conversationRepository.findByUserIdOrderByLastMessageAtDesc(userId).stream()
                .map(c -> ConversationResponse.summary(c, lastBody(c.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(String email) {
        return conversationRepository.countByUserIdAndUnreadForUserTrue(userId(email));
    }

    @Transactional
    public ConversationResponse getThread(String email, UUID conversationId) {
        Conversation conversation = ownedConversation(email, conversationId);
        if (conversation.isUnreadForUser()) {
            conversation.setUnreadForUser(false);
            conversationRepository.save(conversation);
        }
        return ConversationResponse.withThread(conversation, threadOf(conversationId));
    }

    @Transactional
    public ConversationResponse start(String email, String subject, String body) {
        UUID userId = userId(email);
        Conversation conversation = conversationRepository.save(Conversation.builder()
                .userId(userId)
                .subject(subject)
                .lastMessageAt(Instant.now())
                .unreadForUser(false)
                .build());

        persist(conversation, MessageSender.USER, body);
        persist(conversation, MessageSender.SUPPORT, AUTO_REPLY);
        conversation.setUnreadForUser(true);
        conversation.setLastMessageAt(Instant.now());
        conversationRepository.save(conversation);

        return ConversationResponse.withThread(conversation, threadOf(conversation.getId()));
    }

    @Transactional
    public ConversationResponse reply(String email, UUID conversationId, String body) {
        Conversation conversation = ownedConversation(email, conversationId);
        persist(conversation, MessageSender.USER, body);
        conversation.setLastMessageAt(Instant.now());
        conversation.setUnreadForUser(false);
        conversationRepository.save(conversation);
        return ConversationResponse.withThread(conversation, threadOf(conversationId));
    }

    private void persist(Conversation conversation, MessageSender sender, String body) {
        messageRepository.save(Message.builder()
                .conversationId(conversation.getId())
                .sender(sender)
                .body(body)
                .build());
    }

    private List<MessageResponse> threadOf(UUID conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(MessageResponse::from)
                .toList();
    }

    private String lastBody(UUID conversationId) {
        var messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        return messages.isEmpty() ? "" : messages.get(messages.size() - 1).getBody();
    }

    private Conversation ownedConversation(String email, UUID conversationId) {
        UUID userId = userId(email);
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.CONVERSATION_NOT_FOUND));
        if (!conversation.getUserId().equals(userId)) {
            throw TravelAiException.forbidden(ErrorCode.ACCESS_DENIED);
        }
        return conversation;
    }

    private UUID userId(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
        return user.getId();
    }
}
