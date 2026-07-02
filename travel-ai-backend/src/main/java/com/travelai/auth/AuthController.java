package com.travelai.auth;

import com.travelai.auth.dto.AuthResponse;
import com.travelai.auth.dto.ForgotPasswordRequest;
import com.travelai.auth.dto.LoginRequest;
import com.travelai.auth.dto.LoginResponse;
import com.travelai.auth.dto.RefreshRequest;
import com.travelai.auth.dto.RegisterRequest;
import com.travelai.auth.dto.ResetPasswordRequest;
import com.travelai.auth.dto.SocialLoginRequest;
import com.travelai.auth.dto.TwoFactorCodeRequest;
import com.travelai.auth.dto.TwoFactorEnableResponse;
import com.travelai.auth.dto.TwoFactorSetupResponse;
import com.travelai.auth.dto.TwoFactorVerifyRequest;
import com.travelai.auth.dto.VerifyEmailRequest;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TwoFactorService twoFactorService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /**
     * Password login. Returns full tokens for non-2FA accounts; for 2FA accounts
     * returns {@code mfaRequired=true} plus a short-lived mfaToken to be completed
     * via {@code /auth/2fa/verify}.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.loginWithMfa(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ── Two-factor authentication ────────────────────────────────────────────

    /** Authenticated: begins 2FA enrolment (stores pending secret; not yet enabled). */
    @PostMapping("/2fa/setup")
    public ResponseEntity<ApiResponse<TwoFactorSetupResponse>> setup2fa(Authentication auth) {
        TwoFactorSetupResponse response = twoFactorService.setup(auth.getName());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** Authenticated: verifies the first code and enables 2FA, returning recovery codes once. */
    @PostMapping("/2fa/enable")
    public ResponseEntity<ApiResponse<TwoFactorEnableResponse>> enable2fa(
            Authentication auth, @Valid @RequestBody TwoFactorCodeRequest request) {
        TwoFactorEnableResponse response = twoFactorService.enable(auth.getName(), request.code());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** Authenticated: disables 2FA after verifying a TOTP or recovery code. */
    @PostMapping("/2fa/disable")
    public ResponseEntity<ApiResponse<Void>> disable2fa(
            Authentication auth, @Valid @RequestBody TwoFactorCodeRequest request) {
        twoFactorService.disable(auth.getName(), request.code());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /** Public: completes the 2FA login challenge and issues real tokens. */
    @PostMapping("/2fa/verify")
    public ResponseEntity<ApiResponse<LoginResponse>> verify2fa(@Valid @RequestBody TwoFactorVerifyRequest request) {
        LoginResponse response = authService.verifyMfaChallenge(request.mfaToken(), request.code());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshRequest request) {
        AuthResponse response = authService.refresh(request.refreshToken());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(ApiResponse.ok(null));
    }

    /**
     * Sign in / sign up with Google. Body carries the Google ID token obtained
     * client-side; the token is verified server-side before issuing our JWTs.
     * Public endpoint (covered by the {@code /api/auth/**} allow-list).
     */
    @PostMapping("/social/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@Valid @RequestBody SocialLoginRequest request) {
        AuthResponse response = authService.loginWithGoogle(request.idToken());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** Always answers 200 to avoid user enumeration. */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request.token());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /** Authenticated: re-sends the verification email for the current user. */
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(Authentication auth) {
        authService.resendVerification(auth.getName());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
