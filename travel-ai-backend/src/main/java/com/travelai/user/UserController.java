package com.travelai.user;

import com.travelai.shared.domain.ApiResponse;
import com.travelai.user.dto.PreferencesResponse;
import com.travelai.user.dto.ProfileOverviewResponse;
import com.travelai.user.dto.UpdatePreferencesRequest;
import com.travelai.user.dto.UpdateProfileRequest;
import com.travelai.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ProfileService profileService;

    /** GET /users/me — returns current user profile */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(auth.getName())));
    }

    /** GET /users/me/overview — aggregated profile snapshot derived from real activity */
    @GetMapping("/me/overview")
    public ResponseEntity<ApiResponse<ProfileOverviewResponse>> getOverview(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.getOverview(auth.getName())));
    }

    /** PUT /users/me — updates current user profile */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            Authentication auth,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(userService.updateProfile(auth.getName(), request)));
    }

    /** GET /users/me/preferences — returns current user preferences */
    @GetMapping("/me/preferences")
    public ResponseEntity<ApiResponse<PreferencesResponse>> getPreferences(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getPreferences(auth.getName())));
    }

    /** PUT /users/me/preferences — upserts current user preferences */
    @PutMapping("/me/preferences")
    public ResponseEntity<ApiResponse<PreferencesResponse>> updatePreferences(
            Authentication auth,
            @Valid @RequestBody UpdatePreferencesRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(userService.updatePreferences(auth.getName(), request)));
    }
}
