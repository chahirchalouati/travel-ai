package com.travelai.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notification_log")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID userId;

    @Enumerated(EnumType.STRING)
    private NotificationChannel channel;

    private String recipient;

    private String subject;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.PENDING;

    private String errorMessage;

    @Column(nullable = false)
    private Instant sentAt;

    /**
     * Read-only alias mapped to the existing {@code sent_at} column so that
     * derived queries (e.g. orderByCreatedAtDesc) and the in-app notifications
     * view can expose a {@code createdAt} timestamp without a new column.
     */
    @Column(name = "sent_at", insertable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (sentAt == null) {
            sentAt = Instant.now();
        }
    }
}
