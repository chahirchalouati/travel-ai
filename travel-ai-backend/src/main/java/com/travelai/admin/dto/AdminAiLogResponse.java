package com.travelai.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminAiLogResponse(
    UUID id,
    UUID requestId,
    String agent,
    Integer durationMs,
    Integer tokensUsed,
    String model,
    boolean hasError,
    Instant createdAt
) {}
