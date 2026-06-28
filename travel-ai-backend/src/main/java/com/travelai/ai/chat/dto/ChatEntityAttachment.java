package com.travelai.ai.chat.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ChatEntityAttachment(
        UUID id,
        String type,
        String name,
        String subtitle,
        String description,
        String imageUrl,
        BigDecimal price,
        String priceLabel,
        Integer rating,
        BigDecimal latitude,
        BigDecimal longitude,
        List<String> tags
) {
}
