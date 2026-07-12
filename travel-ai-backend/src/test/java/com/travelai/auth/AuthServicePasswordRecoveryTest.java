package com.travelai.auth;

import com.travelai.event.EmailVerificationRequestedEvent;
import com.travelai.event.PasswordResetRequestedEvent;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService password reset and email verification")
class AuthServicePasswordRecoveryTest {

    private static final String FRONTEND_URL = "http://localhost:4200";

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private com.travelai.shared.config.JwtService jwtService;
    @Mock private com.travelai.shared.config.JwtProperties jwtProperties;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "frontendBaseUrl", FRONTEND_URL);
        user = User.builder()
                .email("traveler@example.com")
                .passwordHash("old-hash")
                .firstName("Ada")
                .lastName("Lovelace")
                .role(UserRole.TRAVELER)
                .emailVerified(false)
                .active(true)
                .build();
    }

    private PasswordResetToken tokenFor(User owner, Instant expiresAt, Instant usedAt) {
        return PasswordResetToken.builder()
                .user(owner)
                .token("reset-token")
                .expiresAt(expiresAt)
                .usedAt(usedAt)
                .build();
    }

    @Nested
    @DisplayName("forgotPassword")
    class ForgotPassword {

        @Test
        @DisplayName("creates a 1h single-use token and publishes reset event for known email")
        void knownEmail_createsTokenAndPublishesEvent() {
            when(userRepository.findByEmail("traveler@example.com")).thenReturn(Optional.of(user));

            authService.forgotPassword("traveler@example.com");

            ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
            verify(passwordResetTokenRepository).save(tokenCaptor.capture());
            PasswordResetToken saved = tokenCaptor.getValue();
            assertThat(saved.getUser()).isSameAs(user);
            assertThat(saved.getToken()).isNotBlank();
            assertThat(saved.isUsed()).isFalse();
            assertThat(saved.getExpiresAt())
                    .isCloseTo(Instant.now().plusSeconds(3600), within(60, java.time.temporal.ChronoUnit.SECONDS));

            ArgumentCaptor<PasswordResetRequestedEvent> eventCaptor =
                    ArgumentCaptor.forClass(PasswordResetRequestedEvent.class);
            verify(eventPublisher).publishEvent(eventCaptor.capture());
            assertThat(eventCaptor.getValue().resetLink())
                    .isEqualTo(FRONTEND_URL + "/reset-password?token=" + saved.getToken());
        }

        @Test
        @DisplayName("does nothing (no token, no email) for unknown email")
        void unknownEmail_isSilent() {
            when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

            authService.forgotPassword("ghost@example.com");

            verify(passwordResetTokenRepository, never()).save(any());
            verify(eventPublisher, never()).publishEvent(any());
        }
    }

    @Nested
    @DisplayName("resetPassword")
    class ResetPassword {

        @Test
        @DisplayName("happy path: encodes password, marks token used, revokes refresh tokens")
        void validToken_resetsPassword() {
            PasswordResetToken token = tokenFor(user, Instant.now().plusSeconds(600), null);
            when(passwordResetTokenRepository.findByToken("reset-token")).thenReturn(Optional.of(token));
            when(passwordEncoder.encode("newPassword123")).thenReturn("new-hash");

            authService.resetPassword("reset-token", "newPassword123");

            assertThat(user.getPasswordHash()).isEqualTo("new-hash");
            assertThat(token.isUsed()).isTrue();
            verify(userRepository).save(user);
            verify(passwordResetTokenRepository).save(token);
            verify(refreshTokenRepository).deleteByUser(user);
        }

        @Test
        @DisplayName("unknown token throws TOKEN_INVALID")
        void unknownToken_throwsInvalid() {
            when(passwordResetTokenRepository.findByToken("nope")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.resetPassword("nope", "newPassword123"))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.TOKEN_INVALID);
            verify(refreshTokenRepository, never()).deleteByUser(any());
        }

        @Test
        @DisplayName("expired token throws TOKEN_EXPIRED and leaves password untouched")
        void expiredToken_throwsExpired() {
            PasswordResetToken token = tokenFor(user, Instant.now().minusSeconds(60), null);
            when(passwordResetTokenRepository.findByToken("reset-token")).thenReturn(Optional.of(token));

            assertThatThrownBy(() -> authService.resetPassword("reset-token", "newPassword123"))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.TOKEN_EXPIRED);
            assertThat(user.getPasswordHash()).isEqualTo("old-hash");
            verify(refreshTokenRepository, never()).deleteByUser(any());
        }

        @Test
        @DisplayName("already-used token throws TOKEN_INVALID (single use)")
        void usedToken_throwsInvalid() {
            PasswordResetToken token = tokenFor(user, Instant.now().plusSeconds(600), Instant.now().minusSeconds(30));
            when(passwordResetTokenRepository.findByToken("reset-token")).thenReturn(Optional.of(token));

            assertThatThrownBy(() -> authService.resetPassword("reset-token", "newPassword123"))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.TOKEN_INVALID);
            assertThat(user.getPasswordHash()).isEqualTo("old-hash");
        }
    }

    @Nested
    @DisplayName("verifyEmail")
    class VerifyEmail {

        @Test
        @DisplayName("valid token marks user verified and clears the token")
        void validToken_verifies() {
            user.setEmailVerificationToken("verify-token");
            when(userRepository.findByEmailVerificationToken("verify-token")).thenReturn(Optional.of(user));

            authService.verifyEmail("verify-token");

            assertThat(user.isEmailVerified()).isTrue();
            assertThat(user.getEmailVerificationToken()).isNull();
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("unknown token throws TOKEN_INVALID")
        void unknownToken_throwsInvalid() {
            when(userRepository.findByEmailVerificationToken("nope")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.verifyEmail("nope"))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.TOKEN_INVALID);
        }
    }

    @Nested
    @DisplayName("resendVerification")
    class ResendVerification {

        @Test
        @DisplayName("generates a token when missing and publishes verification event")
        void unverifiedUser_sendsEmail() {
            when(userRepository.findByEmail("traveler@example.com")).thenReturn(Optional.of(user));

            authService.resendVerification("traveler@example.com");

            assertThat(user.getEmailVerificationToken()).isNotBlank();
            ArgumentCaptor<EmailVerificationRequestedEvent> eventCaptor =
                    ArgumentCaptor.forClass(EmailVerificationRequestedEvent.class);
            verify(eventPublisher).publishEvent(eventCaptor.capture());
            assertThat(eventCaptor.getValue().verifyLink())
                    .isEqualTo(FRONTEND_URL + "/verify-email?token=" + user.getEmailVerificationToken());
        }

        @Test
        @DisplayName("no-op when the user is already verified")
        void verifiedUser_isNoOp() {
            user.setEmailVerified(true);
            when(userRepository.findByEmail("traveler@example.com")).thenReturn(Optional.of(user));

            authService.resendVerification("traveler@example.com");

            verify(eventPublisher, never()).publishEvent(any());
        }

        @Test
        @DisplayName("unknown user throws USER_NOT_FOUND")
        void unknownUser_throws() {
            when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.resendVerification("ghost@example.com"))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.USER_NOT_FOUND);
        }
    }
}
