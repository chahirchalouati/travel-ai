package com.travelai.notification;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.auth.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;

/**
 * Admin-triggered in-app broadcast: writes an IN_APP {@link NotificationLog} row for every
 * targeted active user so the message appears in each user's notification center.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationBroadcastService {

    private final UserRepository userRepository;
    private final NotificationLogRepository notificationLogRepository;

    @Transactional
    public int broadcast(String subject, String body, String role) {
        if (!StringUtils.hasText(subject) || !StringUtils.hasText(body)) {
            throw new IllegalArgumentException("Subject and body are required");
        }
        List<User> recipients = resolveRecipients(role);
        Instant now = Instant.now();
        List<NotificationLog> logs = recipients.stream()
                .map(u -> NotificationLog.builder()
                        .userId(u.getId())
                        .channel(NotificationChannel.IN_APP)
                        .recipient(u.getEmail())
                        .subject(subject.trim())
                        .body(body.trim())
                        .status(NotificationStatus.SENT)
                        .sentAt(now)
                        .build())
                .toList();
        notificationLogRepository.saveAll(logs);
        log.info("Admin broadcast '{}' delivered to {} users (role filter: {})",
                subject, logs.size(), role == null ? "ALL" : role);
        return logs.size();
    }

    private List<User> resolveRecipients(String role) {
        if (!StringUtils.hasText(role)) {
            return userRepository.findByActiveTrue();
        }
        UserRole target;
        try {
            target = UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown role: " + role);
        }
        return userRepository.findByRoleAndActiveTrue(target);
    }
}
