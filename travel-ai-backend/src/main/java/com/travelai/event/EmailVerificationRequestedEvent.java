package com.travelai.event;

import java.util.UUID;

/** Published when a user must verify their email address (registration or resend). */
public record EmailVerificationRequestedEvent(
        UUID userId,
        String userEmail,
        String userName,
        String verifyLink) {}
