package com.travelai.auth;

/**
 * Supported social identity providers. Only GOOGLE is wired today; APPLE is
 * reserved so the sign-in flow, entity and schema can grow to it without a
 * migration to the {@code social_account.provider} column.
 */
public enum SocialProvider {
    GOOGLE,
    APPLE
}
