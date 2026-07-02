package com.travelai.auth;

import com.travelai.auth.dto.AuthResponse;
import com.travelai.auth.social.GoogleTokenVerifier;
import com.travelai.auth.social.SocialIdentity;
import com.travelai.shared.config.JwtProperties;
import com.travelai.shared.config.JwtService;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Google social login (find-or-create-or-link)")
class AuthServiceSocialLoginTest {

    private static final String ID_TOKEN = "google.id.token";
    private static final String GOOGLE_SUB = "google-sub-123";
    private static final String EMAIL = "traveler@example.com";

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private SocialAccountRepository socialAccountRepository;
    @Mock private JwtService jwtService;
    @Mock private JwtProperties jwtProperties;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private GoogleTokenVerifier googleTokenVerifier;

    @InjectMocks private AuthService authService;

    private SocialIdentity identity;

    @BeforeEach
    void setUp() {
        identity = new SocialIdentity(GOOGLE_SUB, EMAIL, "Ada", "Lovelace", true);
    }

    private User existingUser(boolean emailVerified) {
        return User.builder()
                .email(EMAIL)
                .passwordHash("hash")
                .firstName("Ada")
                .lastName("Lovelace")
                .role(UserRole.TRAVELER)
                .emailVerified(emailVerified)
                .active(true)
                .build();
    }

    private void stubTokenIssuance() {
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");
        when(jwtProperties.expirationMs()).thenReturn(86400000L);
    }

    @Nested
    @DisplayName("existing linked social account")
    class LinkedAccount {

        @Test
        @DisplayName("returns the already-linked user without creating or linking anything")
        void linkedAccount_reused() {
            User user = existingUser(true);
            SocialAccount linked = SocialAccount.builder()
                    .user(user)
                    .provider(SocialProvider.GOOGLE)
                    .providerUserId(GOOGLE_SUB)
                    .email(EMAIL)
                    .build();
            when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(identity);
            when(socialAccountRepository.findByProviderAndProviderUserId(SocialProvider.GOOGLE, GOOGLE_SUB))
                    .thenReturn(Optional.of(linked));
            stubTokenIssuance();

            AuthResponse response = authService.loginWithGoogle(ID_TOKEN);

            assertThat(response.accessToken()).isEqualTo("access-token");
            assertThat(response.refreshToken()).isEqualTo("refresh-token");
            assertThat(response.role()).isEqualTo(UserRole.TRAVELER.name());
            verify(userRepository, never()).save(any());
            verify(socialAccountRepository, never()).save(any());
            verify(refreshTokenRepository).deleteByUser(user);
        }
    }

    @Nested
    @DisplayName("existing user by email (first Google sign-in)")
    class LinkByEmail {

        @Test
        @DisplayName("links a new social account to the existing email-matched user")
        void existingEmail_linksSocialAccount() {
            User user = existingUser(true);
            when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(identity);
            when(socialAccountRepository.findByProviderAndProviderUserId(SocialProvider.GOOGLE, GOOGLE_SUB))
                    .thenReturn(Optional.empty());
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            stubTokenIssuance();

            authService.loginWithGoogle(ID_TOKEN);

            ArgumentCaptor<SocialAccount> captor = ArgumentCaptor.forClass(SocialAccount.class);
            verify(socialAccountRepository).save(captor.capture());
            SocialAccount saved = captor.getValue();
            assertThat(saved.getUser()).isSameAs(user);
            assertThat(saved.getProvider()).isEqualTo(SocialProvider.GOOGLE);
            assertThat(saved.getProviderUserId()).isEqualTo(GOOGLE_SUB);
            assertThat(saved.getEmail()).isEqualTo(EMAIL);
            // No new user provisioned when the email already exists.
            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("brand-new user")
    class NewUser {

        @Test
        @DisplayName("provisions a new TRAVELER, mirrors email_verified, and links the social account")
        void newUser_created() {
            when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(identity);
            when(socialAccountRepository.findByProviderAndProviderUserId(SocialProvider.GOOGLE, GOOGLE_SUB))
                    .thenReturn(Optional.empty());
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("random-hash");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            stubTokenIssuance();

            authService.loginWithGoogle(ID_TOKEN);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User created = userCaptor.getValue();
            assertThat(created.getEmail()).isEqualTo(EMAIL);
            assertThat(created.getFirstName()).isEqualTo("Ada");
            assertThat(created.getLastName()).isEqualTo("Lovelace");
            assertThat(created.getRole()).isEqualTo(UserRole.TRAVELER);
            assertThat(created.isEmailVerified()).isTrue();
            assertThat(created.getPasswordHash()).isEqualTo("random-hash");

            verify(socialAccountRepository).save(any(SocialAccount.class));
        }

        @Test
        @DisplayName("unverified Google email produces an unverified local user")
        void newUser_unverifiedEmail() {
            SocialIdentity unverified = new SocialIdentity(GOOGLE_SUB, EMAIL, "Ada", "Lovelace", false);
            when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(unverified);
            when(socialAccountRepository.findByProviderAndProviderUserId(SocialProvider.GOOGLE, GOOGLE_SUB))
                    .thenReturn(Optional.empty());
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("random-hash");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            stubTokenIssuance();

            authService.loginWithGoogle(ID_TOKEN);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().isEmailVerified()).isFalse();
        }

        @Test
        @DisplayName("blank Google names fall back to defaults")
        void newUser_blankNames_defaulted() {
            SocialIdentity noNames = new SocialIdentity(GOOGLE_SUB, EMAIL, null, "", true);
            when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(noNames);
            when(socialAccountRepository.findByProviderAndProviderUserId(SocialProvider.GOOGLE, GOOGLE_SUB))
                    .thenReturn(Optional.empty());
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("random-hash");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            stubTokenIssuance();

            authService.loginWithGoogle(ID_TOKEN);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getFirstName()).isEqualTo("Traveler");
            assertThat(userCaptor.getValue().getLastName()).isEqualTo("");
        }
    }

    @Nested
    @DisplayName("token verification failures")
    class VerificationFailures {

        @Test
        @DisplayName("invalid token propagates 401 and issues no tokens")
        void invalidToken_propagates() {
            when(googleTokenVerifier.verify(ID_TOKEN))
                    .thenThrow(TravelAiException.unauthorized(ErrorCode.SOCIAL_TOKEN_INVALID));

            assertThatThrownBy(() -> authService.loginWithGoogle(ID_TOKEN))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.SOCIAL_TOKEN_INVALID);

            verify(userRepository, never()).save(any());
            verify(socialAccountRepository, never()).save(any());
            verify(refreshTokenRepository, never()).deleteByUser(any());
        }

        @Test
        @DisplayName("feature-disabled propagates the disabled error")
        void disabled_propagates() {
            when(googleTokenVerifier.verify(ID_TOKEN))
                    .thenThrow(TravelAiException.badRequest(ErrorCode.SOCIAL_LOGIN_DISABLED));

            assertThatThrownBy(() -> authService.loginWithGoogle(ID_TOKEN))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.SOCIAL_LOGIN_DISABLED);

            verify(socialAccountRepository, never())
                    .findByProviderAndProviderUserId(any(), anyString());
        }
    }
}
