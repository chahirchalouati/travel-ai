package com.travelai.featureflag;

import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public read of effective flags (role + rollout aware) so the frontend can gate UI. */
@RestController
@RequestMapping("/feature-flags")
@RequiredArgsConstructor
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    @GetMapping
    public ApiResponse<Map<String, Boolean>> enabled(@AuthenticationPrincipal UserDetails user) {
        String userKey = user != null ? user.getUsername() : null;
        String role = user == null ? null : user.getAuthorities().stream()
                .map(a -> a.getAuthority().replaceFirst("^ROLE_", ""))
                .findFirst().orElse(null);
        return ApiResponse.ok(featureFlagService.enabledFlagsFor(userKey, role));
    }
}
