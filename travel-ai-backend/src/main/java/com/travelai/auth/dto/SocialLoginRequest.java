package com.travelai.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Body for {@code POST /api/auth/social/google}: the Google ID token (JWT) from the client. */
public record SocialLoginRequest(
        @NotBlank String idToken
) {}
