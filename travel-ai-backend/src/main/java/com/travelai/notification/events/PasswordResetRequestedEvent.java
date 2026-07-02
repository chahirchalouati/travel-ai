package com.travelai.notification.events;

import java.util.UUID;

/** Published when a user requests a password reset link. */
public record PasswordResetRequestedEvent(
        UUID userId,
        String userEmail,
        String userName,
        String resetLink) {}
