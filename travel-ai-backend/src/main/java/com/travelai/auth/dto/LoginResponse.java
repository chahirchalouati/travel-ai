package com.travelai.auth.dto;

/**
 * Login outcome. Backward compatible with the previous token-only shape: when
 * 2FA is not required, {@code mfaRequired} is false and the token fields are
 * populated exactly as before. When the account has 2FA enabled, only
 * {@code mfaRequired=true} and a short-lived {@code mfaToken} are returned, and
 * the caller must complete {@code POST /auth/2fa/verify} to obtain tokens.
 */
public record LoginResponse(
        boolean mfaRequired,
        String mfaToken,
        String accessToken,
        String refreshToken,
        Long expiresIn,
        String role
) {
    /** Non-2FA login (or completed 2FA verification): full tokens issued. */
    public static LoginResponse tokens(AuthResponse auth) {
        return new LoginResponse(false, null,
                auth.accessToken(), auth.refreshToken(), auth.expiresIn(), auth.role());
    }

    /** 2FA challenge: no tokens yet, client must verify a code. */
    public static LoginResponse challenge(String mfaToken) {
        return new LoginResponse(true, mfaToken, null, null, null, null);
    }
}
