package com.travelai.ai.chat.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChatResponse(
        UUID conversationId,
        String title,
        String reply,
        List<ChatEntityAttachment> attachments,
        Instant timestamp
) {
}
