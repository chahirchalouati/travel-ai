package com.travelai.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Completes a 2FA login challenge: the short-lived mfaToken plus a TOTP/recovery code. */
public record TwoFactorVerifyRequest(
        @NotBlank String mfaToken,
        @NotBlank String code
) {}
