package com.travelai.user.dto;

import com.travelai.user.UserPhoto;

import java.time.Instant;
import java.util.UUID;

public record PhotoResponse(UUID id, String url, String caption, String place, Instant createdAt) {
    public static PhotoResponse from(UserPhoto p) {
        return new PhotoResponse(p.getId(), p.getUrl(), p.getCaption(), p.getPlace(), p.getCreatedAt());
    }
}
