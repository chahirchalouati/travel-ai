package com.travelai.auth.social;

/**
 * The verified subset of claims we trust from a social ID token, normalised
 * across providers. {@code subject} is the provider's stable unique id (Google's
 * {@code sub}); {@code emailVerified} reflects the provider's own verification.
 */
public record SocialIdentity(
        String subject,
        String email,
        String firstName,
        String lastName,
        boolean emailVerified
) {}
