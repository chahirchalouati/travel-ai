package com.travelai.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StartConversationRequest(
        @NotBlank @Size(max = 200) String subject,
        @NotBlank @Size(max = 4000) String body) {}
