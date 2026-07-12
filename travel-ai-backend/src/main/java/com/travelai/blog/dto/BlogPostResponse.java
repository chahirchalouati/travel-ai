package com.travelai.blog.dto;

import java.util.UUID;

public record BlogPostResponse(
        UUID id,
        String slug,
        String title,
        String excerpt,
        String category,
        int readMin,
        String dateLabel,
        String icon,
        String accent,
        boolean featured
) {}
