package com.travelai.user.dto;

import com.travelai.shared.domain.SpendingPriority;

import java.util.List;
import java.util.UUID;

public record PreferencesResponse(
        UUID id,
        SpendingPriority spendingPriority,
        List<String> constraints,
        Integer preferredBudget,
        String language
) {}
