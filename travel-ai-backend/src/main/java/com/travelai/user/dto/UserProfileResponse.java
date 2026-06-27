package com.travelai.user.dto;

import com.travelai.auth.UserRole;

import java.time.Instant;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String phone,
        UserRole role,
        boolean emailVerified,
        Instant createdAt
) {}
