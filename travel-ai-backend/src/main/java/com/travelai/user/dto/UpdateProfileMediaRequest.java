package com.travelai.user.dto;

import jakarta.validation.constraints.Size;

/** Partial update of profile presentation fields. Null fields are left unchanged. */
public record UpdateProfileMediaRequest(
        @Size(max = 500) String avatarUrl,
        @Size(max = 500) String coverUrl,
        @Size(max = 500) String bio,
        @Size(max = 120) String location,
        @Size(max = 60) String handle
) {}
