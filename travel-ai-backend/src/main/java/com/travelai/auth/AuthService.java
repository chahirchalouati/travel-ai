package com.travelai.auth;

import com.travelai.auth.dto.AuthResponse;
import com.travelai.auth.dto.LoginRequest;
import com.travelai.auth.dto.RefreshRequest;
import com.travelai.auth.dto.RegisterRequest;
import com.travelai.auth.social.GoogleTokenVerifier;
import com.travelai.auth.social.SocialIdentity;
import com.travelai.notification.events.EmailVerificationRequestedEvent;
import com.travelai.notification.events.PasswordResetRequestedEvent;
import com.travelai.shared.config.JwtProperties;
import com.travelai.shared.config.JwtService;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AuthService {

    private static final Duration RESET_TOKEN_TTL = Duration.ofHours(1);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final ApplicationEventPublisher eventPublisher;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Value("${app.frontend-base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw TravelAiException.conflict(ErrorCode.USER_ALREADY_EXISTS);
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .role(UserRole.TRAVELER)
                .emailVerified(false)
                .active(true)
                .build();

        user.setEmailVerificationToken(UUID.randomUUID().toString());

        User savedUser = userRepository.save(user);
        log.info("Registered new user: {}", savedUser.getEmail());

        publishVerificationEmail(savedUser);

        String accessToken = jwtService.generateAccessToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);
        saveRefreshToken(savedUser, refreshToken);

        return buildAuthResponse(savedUser, accessToken, refreshToken);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (AuthenticationException ex) {
            log.warn("Login failed for email: {}", request.email());
            throw TravelAiException.unauthorized(ErrorCode.INVALID_CREDENTIALS);
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));

        refreshTokenRepository.deleteByUser(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        saveRefreshToken(user, refreshToken);

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    public AuthResponse refresh(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> TravelAiException.unauthorized(ErrorCode.TOKEN_INVALID));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw TravelAiException.unauthorized(ErrorCode.TOKEN_EXPIRED);
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(user);

        log.info("Refreshed access token for user: {}", user.getEmail());
        return buildAuthResponse(user, newAccessToken, refreshTokenValue);
    }

    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue)
                .ifPresent(token -> {
                    token.revoke();
                    refreshTokenRepository.save(token);
                    log.info("Revoked refresh token for user: {}", token.getUser().getEmail());
                });
    }

    /**
     * Starts the password reset flow. Deliberately silent when the email is
     * unknown, so the endpoint cannot be used to enumerate accounts.
     */
    public void forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresentOrElse(user -> {
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .token(UUID.randomUUID().toString())
                    .expiresAt(Instant.now().plus(RESET_TOKEN_TTL))
                    .build();
            passwordResetTokenRepository.save(resetToken);

            String resetLink = frontendBaseUrl + "/reset-password?token=" + resetToken.getToken();
            eventPublisher.publishEvent(new PasswordResetRequestedEvent(
                    user.getId(), user.getEmail(), user.getFirstName(), resetLink));
            log.info("Password reset requested for user: {}", user.getEmail());
        }, () -> log.info("Password reset requested for unknown email"));
    }

    /** Validates a single-use reset token, updates the password and revokes all refresh tokens. */
    public void resetPassword(String tokenValue, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> TravelAiException.badRequest(ErrorCode.TOKEN_INVALID));

        if (resetToken.isUsed()) {
            throw TravelAiException.badRequest(ErrorCode.TOKEN_INVALID);
        }
        if (resetToken.isExpired()) {
            throw TravelAiException.badRequest(ErrorCode.TOKEN_EXPIRED);
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.markUsed();
        passwordResetTokenRepository.save(resetToken);

        refreshTokenRepository.deleteByUser(user);
        log.info("Password reset completed for user: {}", user.getEmail());
    }

    /** Marks the account matching the verification token as verified. */
    public void verifyEmail(String tokenValue) {
        User user = userRepository.findByEmailVerificationToken(tokenValue)
                .orElseThrow(() -> TravelAiException.badRequest(ErrorCode.TOKEN_INVALID));

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        userRepository.save(user);
        log.info("Email verified for user: {}", user.getEmail());
    }

    /** Re-sends the verification email for the authenticated user; no-op when already verified. */
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));

        if (user.isEmailVerified()) {
            log.info("Verification resend skipped, already verified: {}", user.getEmail());
            return;
        }

        if (user.getEmailVerificationToken() == null) {
            user.setEmailVerificationToken(UUID.randomUUID().toString());
            userRepository.save(user);
        }
        publishVerificationEmail(user);
        log.info("Verification email re-sent to: {}", user.getEmail());
    }

    private void publishVerificationEmail(User user) {
        String verifyLink = frontendBaseUrl + "/verify-email?token=" + user.getEmailVerificationToken();
        eventPublisher.publishEvent(new EmailVerificationRequestedEvent(
                user.getId(), user.getEmail(), user.getFirstName(), verifyLink));
    }

    /**
     * Signs a user in via Google. Verifies the ID token server-side, then finds
     * the user by linked social account → by email (linking a new social account)
     * → else provisions a new account. Issues our own JWTs via the same path as
     * {@link #login}/{@link #register}.
     */
    public AuthResponse loginWithGoogle(String idToken) {
        SocialIdentity identity = googleTokenVerifier.verify(idToken);
        User user = resolveSocialUser(SocialProvider.GOOGLE, identity);

        refreshTokenRepository.deleteByUser(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        saveRefreshToken(user, refreshToken);

        log.info("Google social login for user: {}", user.getEmail());
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    /**
     * Resolves the local {@link User} for a verified social identity, creating or
     * linking records as needed. Package-private so it can be exercised directly
     * in unit tests without going through token verification.
     */
    User resolveSocialUser(SocialProvider provider, SocialIdentity identity) {
        // 1) Already linked → return that user.
        var linked = socialAccountRepository
                .findByProviderAndProviderUserId(provider, identity.subject());
        if (linked.isPresent()) {
            return linked.get().getUser();
        }

        // 2) Existing local account with the same email → link it.
        User user = userRepository.findByEmail(identity.email())
                .orElseGet(() -> createSocialUser(identity));

        linkSocialAccount(provider, identity, user);
        return user;
    }

    private User createSocialUser(SocialIdentity identity) {
        User user = User.builder()
                .email(identity.email())
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .firstName(orDefault(identity.firstName(), "Traveler"))
                .lastName(orDefault(identity.lastName(), ""))
                .role(UserRole.TRAVELER)
                .emailVerified(identity.emailVerified())
                .active(true)
                .build();
        User saved = userRepository.save(user);
        log.info("Provisioned new user via social login: {}", saved.getEmail());
        return saved;
    }

    private void linkSocialAccount(SocialProvider provider, SocialIdentity identity, User user) {
        SocialAccount account = SocialAccount.builder()
                .user(user)
                .provider(provider)
                .providerUserId(identity.subject())
                .email(identity.email())
                .build();
        socialAccountRepository.save(account);
    }

    private static String orDefault(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private void saveRefreshToken(User user, String token) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(Instant.now().plusMillis(jwtProperties.refreshExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return new AuthResponse(
                accessToken,
                refreshToken,
                jwtProperties.expirationMs() / 1000,
                user.getRole().name()
        );
    }
}
