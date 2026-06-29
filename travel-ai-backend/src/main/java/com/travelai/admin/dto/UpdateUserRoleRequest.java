package com.travelai.admin.dto;

import com.travelai.auth.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(@NotNull UserRole role) {}
