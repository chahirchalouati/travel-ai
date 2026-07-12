package com.travelai.shared.domain;

import org.springframework.data.domain.Pageable;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Normalized query for admin list endpoints: pagination/sort (from {@link Pageable}),
 * a free-text {@code search} term and the remaining request params treated as
 * per-field filters. Reserved pagination keys are stripped out.
 */
public record AdminListQuery(Pageable pageable, String search, Map<String, String> filters) {

    /** Builds a query from a Spring-resolved {@link Pageable} plus the raw request params. */
    public static AdminListQuery of(Pageable pageable, Map<String, String> allParams) {
        Map<String, String> filters = new LinkedHashMap<>(allParams == null ? Map.of() : allParams);
        String search = filters.remove("search");
        filters.remove("page");
        filters.remove("size");
        filters.remove("sort");
        return new AdminListQuery(pageable, search, filters);
    }
}
