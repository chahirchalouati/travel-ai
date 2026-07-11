package com.travelai.admin.dto;

import com.travelai.auth.UserRole;

import java.time.Instant;
import java.util.UUID;

public record AdminUserResponse(
    UUID id,
    String email,
    String firstName,
    String lastName,
    String avatarUrl,
    UserRole role,
    boolean active,
    boolean emailVerified,
    Instant createdAt
) {}
