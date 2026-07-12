package com.travelai.media.dto;

import com.travelai.media.StorageService.StoredMedia;

/** Response returned after a successful media upload. */
public record MediaUploadResponse(String url, String key, String contentType, long size) {

    public static MediaUploadResponse from(StoredMedia media) {
        return new MediaUploadResponse(media.url(), media.key(), media.contentType(), media.size());
    }
}
