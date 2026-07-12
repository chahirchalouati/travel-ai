package com.travelai.event;

/**
 * Published for every security-relevant authentication action (login, logout, MFA,
 * registration, social sign-in, password reset, email verification). Consumed by the
 * audit module, which persists it as an audit-trail row.
 *
 * <p>Carries the client IP captured on the request thread by the publisher, because the
 * consumer records it out-of-band and cannot reach the servlet request itself.
 *
 * @param action  snake_case action verb, e.g. {@code login}, {@code login_failed},
 *                {@code mfa_verified}, {@code logout}, {@code password_reset}.
 * @param actor   email involved (the account, or the address that was attempted).
 * @param targetId user id as string when known, otherwise {@code null}
 *                 (e.g. a login attempt for an unknown email).
 * @param success whether the action succeeded.
 * @param ip      originating IP address, or {@code null} when unavailable.
 */
public record AuthAuditEvent(
        String action,
        String actor,
        String targetId,
        boolean success,
        String ip) {}
