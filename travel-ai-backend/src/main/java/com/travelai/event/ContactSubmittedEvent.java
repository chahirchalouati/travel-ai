package com.travelai.event;

import java.util.UUID;

/** Published by the contact module after a contact form message is persisted. */
public record ContactSubmittedEvent(
        UUID messageId,
        String submitterName,
        String submitterEmail,
        String subject,
        String message) {}
