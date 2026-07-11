package com.travelai.featureflag;

import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public read of enabled flags so the frontend can gate UI. */
@RestController
@RequestMapping("/feature-flags")
@RequiredArgsConstructor
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    @GetMapping
    public ApiResponse<Map<String, Boolean>> enabled() {
        return ApiResponse.ok(featureFlagService.enabledFlags());
    }
}
