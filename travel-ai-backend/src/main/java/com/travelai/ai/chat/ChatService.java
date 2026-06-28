package com.travelai.ai.chat;

import com.travelai.ai.chat.dto.*;
import com.travelai.ai.rag.RagEntityResolver;
import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
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
            You are TravelAI, a world-class AI travel concierge — think TripAdvisor meets a \
            personal travel expert. You help users plan trips, discover destinations, find hotels \
            and restaurants, create itineraries, compare options, and answer any travel question.

            RESPONSE STYLE:
            - Use **Markdown formatting**: headers (##, ###), bold, bullet lists, numbered lists
            - When recommending places, use structured format with name, rating, price range, and why
            - Include practical details: costs (€/$), best times, insider tips, pros & cons
            - Use emoji sparingly for visual appeal (🏨 🍽️ ✈️ 🌍 ⭐ 💰 📍 🗓️)
            - For comparisons, use tables when helpful
            - End responses with 2-3 follow-up suggestion questions in this exact format:
              ---
              **You might also want to ask:**
              - Suggestion one?
              - Suggestion two?
              - Suggestion three?
            - Be enthusiastic, knowledgeable, and specific
            - Keep responses comprehensive but focused (300-500 words for detailed queries, shorter for simple ones)
            - If the user asks something unrelated to travel, gently redirect them
            - When you have data from our database, reference it naturally and accurately""";

    private static final String TITLE_PROMPT_TEMPLATE =
            "Generate a 3-5 word title for a travel conversation that starts with: %s";

    private static final String FALLBACK_REPLY =
            "I'm sorry, I'm having trouble processing your request right now. " +
            "Please try again in a moment, and I'll be happy to help with your travel plans!";

    private static final int RAG_TOP_K = 5;
    private static final double RAG_SIMILARITY_THRESHOLD = 0.7;

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final RagEntityResolver ragEntityResolver;
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

        List<Document> ragResults = retrieveDocuments(request.message());
        String aiReply = callAi(conversation.getId(), request.message(), ragResults);
        List<ChatEntityAttachment> attachments = ragEntityResolver.resolveAttachments(ragResults);

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
                attachments,
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

    private String callAi(UUID conversationId, String newMessage, List<Document> ragResults) {
        try {
            String fullPrompt = buildPrompt(conversationId, newMessage, ragResults);
            return chatClient.prompt(fullPrompt).call().content();
        } catch (Exception e) {
            log.warn("AI chat call failed for conversation {}: {}", conversationId, e.getMessage());
            return FALLBACK_REPLY;
        }
    }

    private String buildPrompt(UUID conversationId, String newMessage, List<Document> ragResults) {
        List<ChatMessage> history = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId);

        int startIndex = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
        List<ChatMessage> recentHistory = history.subList(startIndex, history.size());

        String ragContext = ragResults.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n---\n"));

        StringBuilder prompt = new StringBuilder();
        prompt.append("System: ").append(SYSTEM_PROMPT).append("\n\n");

        if (!ragContext.isEmpty()) {
            prompt.append("Relevant information from our database:\n")
                    .append(ragContext)
                    .append("\nUse the above information to give specific, accurate answers. ")
                    .append("If the information doesn't match the user's question, rely on your general knowledge.\n\n");
        }

        for (ChatMessage msg : recentHistory) {
            String label = "user".equals(msg.getRole()) ? "User" : "Assistant";
            prompt.append(label).append(": ").append(msg.getContent()).append("\n\n");
        }

        prompt.append("User: ").append(newMessage).append("\n\nAssistant:");

        return prompt.toString();
    }

    private List<Document> retrieveDocuments(String query) {
        try {
            SearchRequest searchRequest = SearchRequest.builder()
                    .query(query)
                    .topK(RAG_TOP_K)
                    .similarityThreshold(RAG_SIMILARITY_THRESHOLD)
                    .build();

            List<Document> results = vectorStore.similaritySearch(searchRequest);
            return results != null ? results : List.of();
        } catch (Exception e) {
            log.warn("RAG retrieval failed, proceeding without context: {}", e.getMessage());
            return List.of();
        }
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
