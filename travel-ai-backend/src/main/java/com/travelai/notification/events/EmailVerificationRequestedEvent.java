package com.travelai.notification.events;

import java.util.UUID;

/** Published when a user must verify their email address (registration or resend). */
public record EmailVerificationRequestedEvent(
        UUID userId,
        String userEmail,
        String userName,
        String verifyLink) {}
