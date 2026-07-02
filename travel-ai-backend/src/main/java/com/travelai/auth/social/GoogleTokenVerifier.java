package com.travelai.auth.social;

/**
 * Verifies a Google ID token server-side and returns the trusted identity.
 * Kept as an interface so the {@link com.travelai.auth.AuthService} social flow
 * can be unit-tested with a mock (no network) and so an Apple verifier can be
 * introduced later behind the same shape.
 */
public interface GoogleTokenVerifier {

    /** @return true only when a non-empty Google client id has been configured. */
    boolean isConfigured();

    /**
     * Verifies the token's signature/audience/expiry against Google and returns
     * the identity it asserts.
     *
     * @throws com.travelai.shared.exception.TravelAiException 503 when the feature
     *         is not configured, 401 when the token is invalid or expired.
     */
    SocialIdentity verify(String idToken);
}
