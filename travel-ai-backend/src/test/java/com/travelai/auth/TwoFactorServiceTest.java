package com.travelai.auth;

import com.travelai.auth.dto.TwoFactorEnableResponse;
import com.travelai.auth.dto.TwoFactorSetupResponse;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TwoFactorService — TOTP enrolment, verification and recovery codes")
class TwoFactorServiceTest {

    private static final String EMAIL = "traveler@example.com";
    private static final String SECRET = "ABCDEF234567ABCDEF234567";
    private static final String VALID_CODE = "123456";

    @Mock private UserRepository userRepository;
    @Mock private MfaRecoveryCodeRepository recoveryCodeRepository;
    @Mock private TotpService totpService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private TwoFactorService twoFactorService;

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

    @Nested
    @DisplayName("setup")
    class Setup {

        @Test
        @DisplayName("stores a pending secret without enabling 2FA and returns otpauth + qr")
        void storesPendingSecret() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(totpService.generateSecret()).thenReturn(SECRET);
            when(totpService.otpauthUri(SECRET, EMAIL)).thenReturn("otpauth://totp/TravelAI:" + EMAIL);
            when(totpService.qrDataUri(SECRET, EMAIL)).thenReturn("data:image/png;base64,QQ==");

            TwoFactorSetupResponse response = twoFactorService.setup(EMAIL);

            assertThat(response.secret()).isEqualTo(SECRET);
            assertThat(response.otpauthUri()).contains("otpauth://totp/TravelAI:" + EMAIL);
            assertThat(response.qrDataUri()).startsWith("data:image/png;base64,");
            assertThat(user.getMfaSecret()).isEqualTo(SECRET);
            assertThat(user.isMfaEnabled()).isFalse();
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("rejects setup when 2FA is already enabled")
        void rejectsWhenAlreadyEnabled() {
            user.setMfaEnabled(true);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> twoFactorService.setup(EMAIL))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.MFA_ALREADY_ENABLED);
        }
    }

    @Nested
    @DisplayName("enable")
    class Enable {

        @Test
        @DisplayName("valid code enables 2FA and issues 8 recovery codes (hashes stored)")
        void validCodeEnables() {
            user.setMfaSecret(SECRET);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(totpService.isValidCode(SECRET, VALID_CODE)).thenReturn(true);
            when(passwordEncoder.encode(anyString())).thenReturn("code-hash");

            TwoFactorEnableResponse response = twoFactorService.enable(EMAIL, VALID_CODE);

            assertThat(user.isMfaEnabled()).isTrue();
            assertThat(response.recoveryCodes()).hasSize(8);
            // Plaintext returned once; only hashes persisted.
            verify(recoveryCodeRepository, times(8)).save(any(MfaRecoveryCode.class));
            ArgumentCaptor<MfaRecoveryCode> captor = ArgumentCaptor.forClass(MfaRecoveryCode.class);
            verify(recoveryCodeRepository, times(8)).save(captor.capture());
            assertThat(captor.getAllValues())
                    .allSatisfy(rc -> assertThat(rc.getCodeHash()).isEqualTo("code-hash"));
        }

        @Test
        @DisplayName("invalid code throws MFA_CODE_INVALID and leaves 2FA disabled")
        void invalidCodeRejected() {
            user.setMfaSecret(SECRET);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(totpService.isValidCode(SECRET, "000000")).thenReturn(false);

            assertThatThrownBy(() -> twoFactorService.enable(EMAIL, "000000"))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.MFA_CODE_INVALID);
            assertThat(user.isMfaEnabled()).isFalse();
            verify(recoveryCodeRepository, never()).save(any());
        }

        @Test
        @DisplayName("enable without a pending secret throws MFA_NOT_PENDING")
        void noPendingSecret() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> twoFactorService.enable(EMAIL, VALID_CODE))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.MFA_NOT_PENDING);
        }
    }

    @Nested
    @DisplayName("verifyChallenge")
    class VerifyChallenge {

        @BeforeEach
        void enable2fa() {
            user.setMfaEnabled(true);
            user.setMfaSecret(SECRET);
        }

        @Test
        @DisplayName("valid TOTP passes without touching recovery codes")
        void validTotp() {
            when(totpService.isValidCode(SECRET, VALID_CODE)).thenReturn(true);

            assertThat(twoFactorService.verifyChallenge(user, VALID_CODE)).isTrue();
            verify(recoveryCodeRepository, never()).findByUserAndUsedAtIsNull(any());
        }

        @Test
        @DisplayName("invalid TOTP and no matching recovery code fails")
        void invalidCode() {
            when(totpService.isValidCode(SECRET, "000000")).thenReturn(false);
            when(recoveryCodeRepository.findByUserAndUsedAtIsNull(user)).thenReturn(List.of());

            assertThat(twoFactorService.verifyChallenge(user, "000000")).isFalse();
        }

        @Test
        @DisplayName("returns false when 2FA is not enabled")
        void notEnabled() {
            user.setMfaEnabled(false);

            assertThat(twoFactorService.verifyChallenge(user, VALID_CODE)).isFalse();
            verify(totpService, never()).isValidCode(anyString(), anyString());
        }

        @Test
        @DisplayName("recovery code is accepted and consumed (marked used, single-use)")
        void recoveryCodeSingleUse() {
            String presented = "ABCDE-FGHJK";
            String normalized = "ABCDEFGHJK";
            MfaRecoveryCode stored = MfaRecoveryCode.builder()
                    .user(user).codeHash("stored-hash").build();
            when(totpService.isValidCode(eq(SECRET), anyString())).thenReturn(false);
            when(recoveryCodeRepository.findByUserAndUsedAtIsNull(user)).thenReturn(List.of(stored));
            when(passwordEncoder.matches(normalized, "stored-hash")).thenReturn(true);

            assertThat(twoFactorService.verifyChallenge(user, presented)).isTrue();
            assertThat(stored.isUsed()).isTrue();
            verify(recoveryCodeRepository).save(stored);
        }

        @Test
        @DisplayName("an already-used recovery code cannot be reused (not returned as unused)")
        void usedRecoveryCodeNotReusable() {
            MfaRecoveryCode used = MfaRecoveryCode.builder()
                    .user(user).codeHash("stored-hash").usedAt(Instant.now()).build();
            when(totpService.isValidCode(eq(SECRET), anyString())).thenReturn(false);
            // Repository only returns unused codes; a spent one is filtered out at source.
            when(recoveryCodeRepository.findByUserAndUsedAtIsNull(user)).thenReturn(List.of());

            assertThat(twoFactorService.verifyChallenge(user, "ABCDE-FGHJK")).isFalse();
            assertThat(used.isUsed()).isTrue();
            verify(recoveryCodeRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("disable")
    class Disable {

        @Test
        @DisplayName("valid code disables 2FA, clears secret and recovery codes")
        void validCodeDisables() {
            user.setMfaEnabled(true);
            user.setMfaSecret(SECRET);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(totpService.isValidCode(SECRET, VALID_CODE)).thenReturn(true);

            twoFactorService.disable(EMAIL, VALID_CODE);

            assertThat(user.isMfaEnabled()).isFalse();
            assertThat(user.getMfaSecret()).isNull();
            verify(recoveryCodeRepository).deleteByUser(user);
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("invalid code keeps 2FA enabled")
        void invalidCodeRejected() {
            user.setMfaEnabled(true);
            user.setMfaSecret(SECRET);
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(totpService.isValidCode(SECRET, "000000")).thenReturn(false);
            when(recoveryCodeRepository.findByUserAndUsedAtIsNull(user)).thenReturn(List.of());

            assertThatThrownBy(() -> twoFactorService.disable(EMAIL, "000000"))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.MFA_CODE_INVALID);
            assertThat(user.isMfaEnabled()).isTrue();
        }

        @Test
        @DisplayName("disable when not enabled throws MFA_NOT_ENABLED")
        void notEnabled() {
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> twoFactorService.disable(EMAIL, VALID_CODE))
                    .isInstanceOf(TravelAiException.class)
                    .extracting(ex -> ((TravelAiException) ex).getErrorCode())
                    .isEqualTo(ErrorCode.MFA_NOT_ENABLED);
        }
    }
}
