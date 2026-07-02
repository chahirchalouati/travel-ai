package com.travelai.auth;

import com.travelai.auth.dto.TwoFactorEnableResponse;
import com.travelai.auth.dto.TwoFactorSetupResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

/**
 * Two-factor (TOTP) enrolment, verification and recovery-code management.
 *
 * <p>Flow: {@link #setup} stores a pending secret without enabling 2FA;
 * {@link #enable} verifies a code against that secret, flips the flag on and
 * issues single-use recovery codes; {@link #verifyChallenge} validates either a
 * TOTP or a recovery code at login; {@link #disable} clears everything.
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TwoFactorService {

    private static final int RECOVERY_CODE_COUNT = 8;
    /** Characters that avoid visual ambiguity (no O/0, I/1). */
    private static final String RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int RECOVERY_CODE_LENGTH = 10;

    private final UserRepository userRepository;
    private final MfaRecoveryCodeRepository recoveryCodeRepository;
    private final TotpService totpService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    /** Starts enrolment: generates and stores a pending secret; 2FA stays disabled. */
    public TwoFactorSetupResponse setup(String email) {
        User user = requireUser(email);
        if (user.isMfaEnabled()) {
            throw TravelAiException.conflict(ErrorCode.MFA_ALREADY_ENABLED);
        }
        String secret = totpService.generateSecret();
        user.setMfaSecret(secret);
        userRepository.save(user);
        log.info("2FA setup started for user: {}", email);
        return new TwoFactorSetupResponse(
                secret,
                totpService.otpauthUri(secret, email),
                totpService.qrDataUri(secret, email));
    }

    /** Verifies the first code against the pending secret and enables 2FA. */
    public TwoFactorEnableResponse enable(String email, String code) {
        User user = requireUser(email);
        if (user.isMfaEnabled()) {
            throw TravelAiException.conflict(ErrorCode.MFA_ALREADY_ENABLED);
        }
        if (user.getMfaSecret() == null) {
            throw TravelAiException.badRequest(ErrorCode.MFA_NOT_PENDING);
        }
        if (!totpService.isValidCode(user.getMfaSecret(), code)) {
            throw TravelAiException.badRequest(ErrorCode.MFA_CODE_INVALID);
        }

        user.setMfaEnabled(true);
        userRepository.save(user);

        List<String> recoveryCodes = regenerateRecoveryCodes(user);
        log.info("2FA enabled for user: {}", email);
        return new TwoFactorEnableResponse(recoveryCodes);
    }

    /** Verifies a code and disables 2FA, wiping the secret and recovery codes. */
    public void disable(String email, String code) {
        User user = requireUser(email);
        if (!user.isMfaEnabled()) {
            throw TravelAiException.badRequest(ErrorCode.MFA_NOT_ENABLED);
        }
        if (!verifyCode(user, code)) {
            throw TravelAiException.badRequest(ErrorCode.MFA_CODE_INVALID);
        }

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        recoveryCodeRepository.deleteByUser(user);
        userRepository.save(user);
        log.info("2FA disabled for user: {}", email);
    }

    /**
     * Validates a TOTP or recovery code during the login challenge for a user
     * that has 2FA enabled. Consumes a recovery code when matched.
     */
    public boolean verifyChallenge(User user, String code) {
        if (!user.isMfaEnabled()) {
            return false;
        }
        return verifyCode(user, code);
    }

    /**
     * Matches {@code code} against the TOTP secret first, then falls back to
     * unused recovery codes (marking a matched one used).
     */
    private boolean verifyCode(User user, String code) {
        if (code == null || code.isBlank()) {
            return false;
        }
        if (totpService.isValidCode(user.getMfaSecret(), code)) {
            return true;
        }
        return consumeRecoveryCode(user, code);
    }

    /** Consumes a matching single-use recovery code; returns true when one matched. */
    private boolean consumeRecoveryCode(User user, String code) {
        String candidate = code.trim().toUpperCase().replace("-", "");
        for (MfaRecoveryCode recovery : recoveryCodeRepository.findByUserAndUsedAtIsNull(user)) {
            if (passwordEncoder.matches(candidate, recovery.getCodeHash())) {
                recovery.markUsed();
                recoveryCodeRepository.save(recovery);
                log.info("2FA recovery code consumed for user: {}", user.getEmail());
                return true;
            }
        }
        return false;
    }

    /** Clears any existing codes and issues a fresh set, returning them in plaintext. */
    private List<String> regenerateRecoveryCodes(User user) {
        recoveryCodeRepository.deleteByUser(user);
        List<String> plaintext = new ArrayList<>(RECOVERY_CODE_COUNT);
        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            String raw = generateRecoveryCode();
            plaintext.add(formatForDisplay(raw));
            recoveryCodeRepository.save(MfaRecoveryCode.builder()
                    .user(user)
                    .codeHash(passwordEncoder.encode(raw))
                    .build());
        }
        return plaintext;
    }

    private String generateRecoveryCode() {
        StringBuilder sb = new StringBuilder(RECOVERY_CODE_LENGTH);
        for (int i = 0; i < RECOVERY_CODE_LENGTH; i++) {
            sb.append(RECOVERY_ALPHABET.charAt(random.nextInt(RECOVERY_ALPHABET.length())));
        }
        return sb.toString();
    }

    /** Presentation only: groups as XXXXX-XXXXX for readability. */
    private String formatForDisplay(String raw) {
        int mid = raw.length() / 2;
        return raw.substring(0, mid) + "-" + raw.substring(mid);
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
    }
}
