package com.travelai.featureflag.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record FeatureFlagUpsertRequest(
        @NotBlank
        @Pattern(regexp = "[a-z0-9._-]{2,80}", message = "Key must be lowercase alphanumerics, dot, dash or underscore")
        String key,
        boolean enabled,
        String description) {
}
