package com.travelai.user;

import com.travelai.shared.domain.ApiResponse;
import com.travelai.user.dto.PreferencesResponse;
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

    /** GET /users/me — returns current user profile */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(auth.getName())));
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
