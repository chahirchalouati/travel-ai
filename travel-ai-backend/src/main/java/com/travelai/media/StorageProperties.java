package com.travelai.media;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * S3-compatible object storage settings. Local dev points at MinIO; production
 * overrides {@code endpoint}/{@code publicUrl}/credentials via environment variables.
 */
@ConfigurationProperties(prefix = "travel-ai.storage")
public record StorageProperties(
        String endpoint,
        String publicUrl,
        String region,
        String bucket,
        String accessKey,
        String secretKey,
        boolean pathStyleAccess,
        long maxFileSizeBytes
) {}
