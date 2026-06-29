package com.travelai.shared.domain;

import java.util.List;

/**
 * Slices an already-filtered, in-memory result list into a single page and wraps
 * it in an {@link ApiResponse} carrying pagination {@link ApiResponse.Meta}.
 *
 * <p>Catalog searches apply availability/budget filters in memory after the DB query,
 * so the authoritative total is only known once the full list is built. Paginating
 * here keeps that total accurate and leaves the cached {@code search()} services untouched.
 */
public final class PageSupport {

    public static final int DEFAULT_SIZE = 12;
    private static final int MAX_SIZE = 60;

    private PageSupport() {
    }

    public static <T> ApiResponse<List<T>> paginate(List<T> all, int page, int size) {
        int safeSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        int safePage = Math.max(page, 0);
        int total = all.size();
        int from = Math.min(safePage * safeSize, total);
        int to = Math.min(from + safeSize, total);
        List<T> slice = List.copyOf(all.subList(from, to));
        return ApiResponse.ok(slice, new ApiResponse.Meta(total, safePage, safeSize));
    }
}
