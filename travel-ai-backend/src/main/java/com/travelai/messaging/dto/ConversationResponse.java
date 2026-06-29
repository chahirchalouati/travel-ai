package com.travelai.messaging.dto;

import com.travelai.messaging.Conversation;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** A conversation summary, optionally including its full message thread. */
public record ConversationResponse(
        UUID id,
        String subject,
        Instant lastMessageAt,
        boolean unread,
        String preview,
        List<MessageResponse> messages) {

    public static ConversationResponse summary(Conversation c, String preview) {
        return new ConversationResponse(c.getId(), c.getSubject(), c.getLastMessageAt(),
                c.isUnreadForUser(), preview, List.of());
    }

    public static ConversationResponse withThread(Conversation c, List<MessageResponse> messages) {
        String preview = messages.isEmpty() ? "" : messages.get(messages.size() - 1).body();
        return new ConversationResponse(c.getId(), c.getSubject(), c.getLastMessageAt(),
                c.isUnreadForUser(), preview, messages);
    }
}
