package com.travelai.featureflag.dto;

import com.travelai.featureflag.FeatureFlag;

import java.time.Instant;
import java.util.UUID;

public record FeatureFlagResponse(
        UUID id,
        String key,
        boolean enabled,
        String description,
        int rolloutPercentage,
        String targetRoles,
        String groupName,
        Instant updatedAt) {

    public static FeatureFlagResponse from(FeatureFlag f) {
        return new FeatureFlagResponse(
                f.getId(), f.getKey(), f.isEnabled(), f.getDescription(),
                f.getRolloutPercentage(), f.getTargetRoles(), f.getGroupName(), f.getUpdatedAt());
    }
}
