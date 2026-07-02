package com.travelai.auth;

import com.travelai.auth.dto.LoginRequest;
import com.travelai.auth.dto.LoginResponse;
import com.travelai.shared.config.JwtProperties;
import com.travelai.shared.config.JwtService;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — MFA login challenge flow")
class AuthServiceMfaLoginTest {

    private static final String EMAIL = "traveler@example.com";

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private JwtService jwtService;
    @Mock private JwtProperties jwtProperties;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private TwoFactorService twoFactorService;

    @InjectMocks private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email(EMAIL)
                .passwordHash("hash")
                .firstName("Ada")
                .lastName("Lovelace")
                .role(UserRole.TRAVELER)
                .emailVerified(true)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("non-2FA account: password login returns full tokens directly")
    void nonMfa_returnsTokens() {
        user.setMfaEnabled(false);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user)).thenReturn("access");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh");
        when(jwtProperties.expirationMs()).thenReturn(3_600_000L);

        LoginResponse response = authService.loginWithMfa(new LoginRequest(EMAIL, "pw"));

        assertThat(response.mfaRequired()).isFalse();
        assertThat(response.accessToken()).isEqualTo("access");
        assertThat(response.refreshToken()).isEqualTo("refresh");
        verify(refreshTokenRepository).deleteByUser(user);
    }

    @Test
    @DisplayName("2FA account: password login returns a challenge, no tokens issued")
    void mfa_returnsChallenge() {
        user.setMfaEnabled(true);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(jwtService.generateMfaChallengeToken(EMAIL)).thenReturn("mfa-token");

        LoginResponse response = authService.loginWithMfa(new LoginRequest(EMAIL, "pw"));

        assertThat(response.mfaRequired()).isTrue();
        assertThat(response.mfaToken()).isEqualTo("mfa-token");
        assertThat(response.accessToken()).isNull();
        verify(jwtService, never()).generateAccessToken(any());
        verify(refreshTokenRepository, never()).deleteByUser(any());
    }

    @Test
    @DisplayName("verifyMfaChallenge with a valid code issues real tokens")
    void verifyChallenge_valid_issuesTokens() {
        when(jwtService.extractMfaChallengeEmail("mfa-token")).thenReturn(EMAIL);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(twoFactorService.verifyChallenge(user, "123456")).thenReturn(true);
        when(jwtService.generateAccessToken(user)).thenReturn("access");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh");
        when(jwtProperties.expirationMs()).thenReturn(3_600_000L);

        LoginResponse response = authService.verifyMfaChallenge("mfa-token", "123456");

        assertThat(response.mfaRequired()).isFalse();
        assertThat(response.accessToken()).isEqualTo("access");
        assertThat(response.refreshToken()).isEqualTo("refresh");
    }

    @Test
    @DisplayName("verifyMfaChallenge with an invalid code throws MFA_CODE_INVALID and issues no tokens")
    void verifyChallenge_invalid_throws() {
        when(jwtService.extractMfaChallengeEmail("mfa-token")).thenReturn(EMAIL);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(twoFactorService.verifyChallenge(user, "000000")).thenReturn(false);

        assertThatThrownBy(() -> authService.verifyMfaChallenge("mfa-token", "000000"))
                .isInstanceOf(TravelAiException.class)
                .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                .isEqualTo(ErrorCode.MFA_CODE_INVALID);
        verify(jwtService, never()).generateAccessToken(any());
    }
}
