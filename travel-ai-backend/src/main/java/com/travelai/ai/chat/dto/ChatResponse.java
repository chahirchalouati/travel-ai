package com.travelai.ai.chat.dto;

import java.time.Instant;
import java.util.UUID;

public record ChatResponse(UUID conversationId, String title, String reply, Instant timestamp) {
}
