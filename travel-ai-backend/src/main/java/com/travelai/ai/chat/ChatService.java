package com.travelai.ai.chat;

import com.travelai.ai.chat.dto.*;
import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private static final int MAX_HISTORY_MESSAGES = 20;

    private static final String SYSTEM_PROMPT = """
            You are TravelAI, an expert AI travel concierge. You help users plan trips, \
            discover destinations, find hotels and restaurants, create itineraries, and answer \
            any travel-related questions. Be enthusiastic, knowledgeable, and specific. When \
            recommending places, include practical details like costs, best times to visit, and \
            insider tips. Keep responses concise but helpful (max 200 words). If the user asks \
            something unrelated to travel, gently redirect them.""";

    private static final String TITLE_PROMPT_TEMPLATE =
            "Generate a 3-5 word title for a travel conversation that starts with: %s";

    private static final String FALLBACK_REPLY =
            "I'm sorry, I'm having trouble processing your request right now. " +
            "Please try again in a moment, and I'll be happy to help with your travel plans!";

    private final ChatClient chatClient;
    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatResponse chat(String userEmail, ChatRequest request) {
        User user = findUser(userEmail);

        ChatConversation conversation = resolveConversation(user, request.conversationId());

        ChatMessage userMessage = ChatMessage.builder()
                .conversation(conversation)
                .role("user")
                .content(request.message())
                .build();
        messageRepository.save(userMessage);

        String aiReply = callAi(conversation.getId(), request.message());

        ChatMessage assistantMessage = ChatMessage.builder()
                .conversation(conversation)
                .role("assistant")
                .content(aiReply)
                .build();
        messageRepository.save(assistantMessage);

        boolean isNewConversation = request.conversationId() == null;
        if (isNewConversation) {
            String title = generateTitle(request.message());
            conversation.setTitle(title);
        }

        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        return new ChatResponse(
                conversation.getId(),
                conversation.getTitle(),
                aiReply,
                Instant.now()
        );
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(String userEmail) {
        User user = findUser(userEmail);
        return conversationRepository.findByUserIdAndActiveTrueOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(c -> new ConversationResponse(c.getId(), c.getTitle(), c.getCreatedAt(), c.getUpdatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ConversationDetailResponse getConversation(String userEmail, UUID conversationId) {
        User user = findUser(userEmail);
        ChatConversation conversation = findConversationOwnedBy(conversationId, user.getId());

        List<MessageResponse> messages = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(m -> new MessageResponse(m.getId(), m.getRole(), m.getContent(), m.getCreatedAt()))
                .toList();

        return new ConversationDetailResponse(
                conversation.getId(),
                conversation.getTitle(),
                messages,
                conversation.getCreatedAt()
        );
    }

    @Transactional
    public void deleteConversation(String userEmail, UUID conversationId) {
        User user = findUser(userEmail);
        ChatConversation conversation = findConversationOwnedBy(conversationId, user.getId());
        conversation.setActive(false);
        conversationRepository.save(conversation);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
    }

    private ChatConversation resolveConversation(User user, UUID conversationId) {
        if (conversationId == null) {
            ChatConversation conversation = ChatConversation.builder()
                    .user(user)
                    .title("New conversation")
                    .build();
            return conversationRepository.save(conversation);
        }
        return findConversationOwnedBy(conversationId, user.getId());
    }

    private ChatConversation findConversationOwnedBy(UUID conversationId, UUID userId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.REQUEST_NOT_FOUND));

        if (!conversation.getUser().getId().equals(userId)) {
            throw TravelAiException.forbidden(ErrorCode.ACCESS_DENIED);
        }
        if (!conversation.isActive()) {
            throw TravelAiException.notFound(ErrorCode.REQUEST_NOT_FOUND);
        }
        return conversation;
    }

    private String callAi(UUID conversationId, String newMessage) {
        try {
            String fullPrompt = buildPrompt(conversationId, newMessage);
            return chatClient.prompt(fullPrompt).call().content();
        } catch (Exception e) {
            log.warn("AI chat call failed for conversation {}: {}", conversationId, e.getMessage());
            return FALLBACK_REPLY;
        }
    }

    private String buildPrompt(UUID conversationId, String newMessage) {
        List<ChatMessage> history = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId);

        int startIndex = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
        List<ChatMessage> recentHistory = history.subList(startIndex, history.size());

        StringBuilder prompt = new StringBuilder();
        prompt.append("System: ").append(SYSTEM_PROMPT).append("\n\n");

        for (ChatMessage msg : recentHistory) {
            String label = "user".equals(msg.getRole()) ? "User" : "Assistant";
            prompt.append(label).append(": ").append(msg.getContent()).append("\n\n");
        }

        prompt.append("User: ").append(newMessage).append("\n\nAssistant:");

        return prompt.toString();
    }

    private String generateTitle(String firstMessage) {
        try {
            String titlePrompt = String.format(TITLE_PROMPT_TEMPLATE, firstMessage);
            return chatClient.prompt(titlePrompt).call().content();
        } catch (Exception e) {
            log.warn("Title generation failed: {}", e.getMessage());
            String truncated = firstMessage.length() > 40
                    ? firstMessage.substring(0, 40) + "..."
                    : firstMessage;
            return truncated;
        }
    }
}
