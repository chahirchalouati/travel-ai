package com.travelai.media;

import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

/**
 * Stores binary media in S3-compatible object storage and returns public URLs.
 * Folder names ({@code avatars}, {@code covers}, {@code gallery}, {@code stories})
 * map to key prefixes inside the configured bucket.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif");

    private static final Set<String> ALLOWED_FOLDERS = Set.of(
            "avatars", "covers", "gallery", "stories", "content");

    private final S3Client s3;
    private final StorageProperties props;

    /** Ensures the bucket exists at startup (no-op if it already does). */
    @PostConstruct
    void ensureBucket() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(props.bucket()).build());
        } catch (NoSuchBucketException e) {
            log.warn("Storage bucket '{}' not found — create it in MinIO/S3 before uploading", props.bucket());
        } catch (Exception e) {
            log.warn("Could not verify storage bucket '{}': {}", props.bucket(), e.getMessage());
        }
    }

    /**
     * Validates and uploads a multipart file, returning a publicly reachable URL.
     *
     * @param file   the uploaded image
     * @param folder logical destination (must be one of the allowed folders)
     */
    public StoredMedia upload(MultipartFile file, String folder) {
        validate(file, folder);

        String extension = extensionFor(file.getContentType());
        String key = "%s/%s%s".formatted(folder, UUID.randomUUID(), extension);

        try {
            s3.putObject(
                    PutObjectRequest.builder()
                            .bucket(props.bucket())
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromBytes(file.getBytes()));
        } catch (IOException e) {
            log.error("Failed to read upload stream for key={}", key, e);
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        } catch (Exception e) {
            log.error("Object storage upload failed for key={}", key, e);
            throw new TravelAiException(ErrorCode.INTERNAL_ERROR, 500);
        }

        return new StoredMedia(key, publicUrl(key), file.getContentType(), file.getSize());
    }

    /** Deletes an object by its full URL or raw key. Silent if it does not exist. */
    public void delete(String urlOrKey) {
        if (urlOrKey == null || urlOrKey.isBlank()) {
            return;
        }
        String key = toKey(urlOrKey);
        if (key == null) {
            return; // external URL we don't own
        }
        try {
            s3.deleteObject(DeleteObjectRequest.builder().bucket(props.bucket()).key(key).build());
        } catch (Exception e) {
            log.warn("Failed to delete object key={}: {}", key, e.getMessage());
        }
    }

    private void validate(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }
        if (!ALLOWED_FOLDERS.contains(folder)) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }
        if (file.getSize() > props.maxFileSizeBytes()) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }
        if (file.getContentType() == null || !ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }
    }

    private String publicUrl(String key) {
        return "%s/%s/%s".formatted(trimTrailingSlash(props.publicUrl()), props.bucket(), key);
    }

    /** Converts a public URL back to a bucket key, or null when not one of ours. */
    private String toKey(String urlOrKey) {
        if (!urlOrKey.startsWith("http")) {
            return urlOrKey;
        }
        String marker = "/" + props.bucket() + "/";
        int idx = urlOrKey.indexOf(marker);
        return idx >= 0 ? urlOrKey.substring(idx + marker.length()) : null;
    }

    private static String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            case "image/avif" -> ".avif";
            default -> ".jpg";
        };
    }

    private static String trimTrailingSlash(String s) {
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    /** Result of a successful upload. */
    public record StoredMedia(String key, String url, String contentType, long size) {}
}
