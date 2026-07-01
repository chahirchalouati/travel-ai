package com.travelai.notification;

import java.time.Instant;
import java.util.UUID;

/**
 * Lightweight projection of a {@link NotificationLog} for the in-app
 * notifications center. Excludes body/recipient to keep the list feed compact.
 */
public record NotificationView(
        UUID id,
        String subject,
        NotificationChannel channel,
        NotificationStatus status,
        Instant createdAt) {

    public static NotificationView from(NotificationLog log) {
        return new NotificationView(
                log.getId(),
                log.getSubject(),
                log.getChannel(),
                log.getStatus(),
                log.getCreatedAt());
    }
}
