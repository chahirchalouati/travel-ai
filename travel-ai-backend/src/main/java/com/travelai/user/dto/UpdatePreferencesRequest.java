package com.travelai.user.dto;

import com.travelai.shared.domain.SpendingPriority;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdatePreferencesRequest(
        SpendingPriority spendingPriority,
        @Size(max = 10) List<String> constraints,
        @Min(400) @Max(10000) Integer preferredBudget,
        @Size(max = 5) String language
) {}
