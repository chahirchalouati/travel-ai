package com.travelai.messaging.dto;

import com.travelai.messaging.Message;
import com.travelai.messaging.MessageSender;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(UUID id, MessageSender sender, String body, Instant createdAt) {

    public static MessageResponse from(Message m) {
        return new MessageResponse(m.getId(), m.getSender(), m.getBody(), m.getCreatedAt());
    }
}
