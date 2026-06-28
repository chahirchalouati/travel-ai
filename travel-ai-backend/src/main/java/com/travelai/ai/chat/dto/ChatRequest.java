package com.travelai.ai.chat.dto;

import java.util.UUID;

public record ChatRequest(UUID conversationId, String message) {
}
