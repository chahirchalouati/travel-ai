package com.travelai.admin.catalog.dto;

import com.travelai.stories.TravelStory;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

/** Admin create/update + view payloads for travel stories. */
public final class AdminStoryDto {

    private AdminStoryDto() {
    }

    public record Upsert(
            @NotBlank String place,
            @NotBlank String country,
            String tag,
            int minutes,
            @NotBlank String posterUrl,
            String videoUrl,
            boolean featured,
            int sortOrder,
            Boolean active
    ) {}

    public record View(
            UUID id,
            String place,
            String country,
            String tag,
            int minutes,
            String posterUrl,
            String videoUrl,
            boolean featured,
            int sortOrder,
            boolean active
    ) {
        public static View from(TravelStory s) {
            return new View(
                    s.getId(), s.getPlace(), s.getCountry(), s.getTag(), s.getMinutes(),
                    s.getPosterUrl(), s.getVideoUrl(), s.isFeatured(), s.getSortOrder(), s.isActive()
            );
        }
    }
}
