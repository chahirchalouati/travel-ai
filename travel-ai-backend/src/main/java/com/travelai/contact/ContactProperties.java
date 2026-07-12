package com.travelai.contact;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for the contact module.
 *
 * <pre>
 * travel-ai:
 *   contact:
 *     admin-email: support@travelai.com
 *     send-submitter-ack: true
 * </pre>
 */
@ConfigurationProperties(prefix = "travel-ai.contact")
public record ContactProperties(
        /** Staff address that receives new contact form notifications. */
        String adminEmail,
        /** When true, an acknowledgement email is also sent to the submitter. */
        boolean sendSubmitterAck) {}
