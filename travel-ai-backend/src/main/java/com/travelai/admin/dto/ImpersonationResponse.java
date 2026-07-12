package com.travelai.admin.dto;

/** Access token + identity of the user an admin is impersonating. */
public record ImpersonationResponse(
        String accessToken,
        String email,
        String firstName,
        String lastName,
        String role) {
}
