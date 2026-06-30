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
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
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

            LANGUAGE (CRITICAL):
            - ALWAYS reply in the SAME language the user writes in. If they write in Italian, reply \
              in Italian; in English, reply in English; in Spanish or French, match that.
            - NEVER answer in Chinese (or any language the user did not use), regardless of your \
              own defaults. Mirror the user's most recent message.
            - If the user's language is genuinely unclear, default to Italian.

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
            "Generate a 3-5 word title, written in the SAME LANGUAGE as the message below "
            + "(never in Chinese unless the message itself is Chinese), for a travel conversation "
            + "that starts with: %s. Reply with ONLY the title, no quotes or extra text.";

    private static final String FALLBACK_REPLY =
            "I'm sorry, I'm having trouble processing your request right now. " +
            "Please try again in a moment, and I'll be happy to help with your travel plans!";

    private static final int RAG_TOP_K = 5;
    // nomic-embed-text scores relevant matches in the ~0.45-0.7 range; 0.7 filtered out nearly
    // everything, leaving the model ungrounded. 0.45 keeps genuinely relevant catalog docs.
    private static final double RAG_SIMILARITY_THRESHOLD = 0.45;

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
        String aiReply = callAi(conversation.getId(), ragResults);
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

    private String callAi(UUID conversationId, List<Document> ragResults) {
        try {
            List<Message> messages = buildMessages(conversationId, ragResults);
            return chatClient.prompt().messages(messages).call().content();
        } catch (Exception e) {
            log.warn("AI chat call failed for conversation {}: {}", conversationId, e.getMessage());
            return FALLBACK_REPLY;
        }
    }

    /**
     * Builds a properly-roled message list: a system message (instructions + RAG context),
     * followed by the recent conversation history. The latest user turn is already persisted
     * in history before this runs, so it must NOT be appended again.
     */
    private List<Message> buildMessages(UUID conversationId, List<Document> ragResults) {
        List<ChatMessage> history = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId);

        int startIndex = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
        List<ChatMessage> recentHistory = history.subList(startIndex, history.size());

        String ragContext = ragResults.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n---\n"));

        StringBuilder system = new StringBuilder(SYSTEM_PROMPT);
        if (!ragContext.isEmpty()) {
            system.append("\n\nRELEVANT INFORMATION FROM OUR DATABASE (use it for specific, accurate answers; ")
                    .append("if it doesn't fit the question, rely on your general knowledge):\n")
                    .append(ragContext);
        }

        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(system.toString()));
        for (ChatMessage msg : recentHistory) {
            messages.add("user".equals(msg.getRole())
                    ? new UserMessage(msg.getContent())
                    : new AssistantMessage(msg.getContent()));
        }
        return messages;
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
