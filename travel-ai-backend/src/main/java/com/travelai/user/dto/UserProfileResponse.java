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
        String avatarUrl,
        String coverUrl,
        String bio,
        String location,
        String handle,
        UserRole role,
        boolean emailVerified,
        Instant createdAt
) {}
