package com.travelai.auth.dto;

/**
 * Result of starting 2FA enrolment. The secret is stored (pending) on the user
 * but two-factor is not yet enforced until a code is verified.
 *
 * @param secret      base32 TOTP shared secret (for manual entry)
 * @param otpauthUri  otpauth:// URI for authenticator apps
 * @param qrDataUri   data:image/png;base64 QR code encoding the otpauth URI
 */
public record TwoFactorSetupResponse(
        String secret,
        String otpauthUri,
        String qrDataUri
) {}
