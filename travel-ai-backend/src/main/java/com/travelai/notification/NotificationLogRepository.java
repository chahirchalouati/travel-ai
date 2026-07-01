package com.travelai.notification;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {

    Page<NotificationLog> findByUserId(UUID userId, Pageable pageable);

    Page<NotificationLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<NotificationLog> findByStatus(NotificationStatus status, Pageable pageable);
}
