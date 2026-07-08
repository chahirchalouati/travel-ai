package com.travelai.sitecontent.dto;

import java.util.List;

public record SiteContentItemResponse(
        String section,
        String title,
        String body,
        String icon,
        String accent,
        String value,
        List<String> bullets
) {}
