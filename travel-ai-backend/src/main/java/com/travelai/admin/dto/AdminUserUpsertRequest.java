package com.travelai.admin.dto;

import com.travelai.auth.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Admin create/update payload for users. Password is required on create, optional on update. */
public record AdminUserUpsertRequest(
        @Email @NotBlank String email,
        String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        String phone,
        UserRole role,
        Boolean emailVerified,
        Boolean active
) {}
