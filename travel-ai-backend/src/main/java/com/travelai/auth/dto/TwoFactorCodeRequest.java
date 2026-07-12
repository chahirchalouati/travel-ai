package com.travelai.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** A TOTP code or recovery code presented to enable/disable 2FA. */
public record TwoFactorCodeRequest(
        @NotBlank String code
) {}
