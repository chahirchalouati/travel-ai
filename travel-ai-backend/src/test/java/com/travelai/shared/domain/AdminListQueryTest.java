package com.travelai.shared.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AdminListQueryTest {

    private final Pageable pageable = PageRequest.of(0, 20);

    @Test
    @DisplayName("of() extracts the search term and strips reserved pagination keys")
    void extractsSearchAndStripsReservedKeys() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("page", "0");
        params.put("size", "20");
        params.put("sort", "name,asc");
        params.put("search", "paris");
        params.put("city", "Rome");
        params.put("active", "true");

        AdminListQuery query = AdminListQuery.of(pageable, params);

        assertThat(query.search()).isEqualTo("paris");
        assertThat(query.filters())
                .containsEntry("city", "Rome")
                .containsEntry("active", "true")
                .doesNotContainKeys("page", "size", "sort", "search");
    }

    @Test
    @DisplayName("of() tolerates null params and a missing search term")
    void toleratesNullParams() {
        AdminListQuery query = AdminListQuery.of(pageable, null);

        assertThat(query.search()).isNull();
        assertThat(query.filters()).isEmpty();
        assertThat(query.pageable()).isEqualTo(pageable);
    }

    @Test
    @DisplayName("of() keeps arbitrary field filters untouched")
    void keepsFieldFilters() {
        AdminListQuery query = AdminListQuery.of(pageable, Map.of("stars", "5", "featured", "true"));

        assertThat(query.filters()).containsEntry("stars", "5").containsEntry("featured", "true");
        assertThat(query.search()).isNull();
    }
}
