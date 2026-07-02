package com.travelai.auth;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import dev.samstevens.totp.util.Utils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Thin, mockable wrapper around the {@code dev.samstevens.totp} library.
 * Isolates the TOTP algorithm so the enrolment/verification logic in
 * {@link TwoFactorService} can be unit-tested with a mocked verifier.
 */
@Slf4j
@Service
public class TotpService {

    private static final String ISSUER = "TravelAI";
    /** Allowed time-step drift on either side of the current window. */
    private static final int ALLOWED_TIME_PERIOD_DISCREPANCY = 1;

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final CodeVerifier codeVerifier;

    public TotpService() {
        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator();
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        verifier.setAllowedTimePeriodDiscrepancy(ALLOWED_TIME_PERIOD_DISCREPANCY);
        this.codeVerifier = verifier;
    }

    /** Generates a fresh base32 TOTP shared secret. */
    public String generateSecret() {
        return secretGenerator.generate();
    }

    /** Builds the standard otpauth:// URI consumed by authenticator apps. */
    public String otpauthUri(String secret, String email) {
        return "otpauth://totp/" + ISSUER + ":" + email
                + "?secret=" + secret
                + "&issuer=" + ISSUER;
    }

    /**
     * Renders a QR code for the secret as a {@code data:image/png;base64,...} URI.
     * Returns {@code null} if QR generation fails; the secret can still be entered manually.
     */
    public String qrDataUri(String secret, String email) {
        QrData data = new QrData.Builder()
                .label(ISSUER + ":" + email)
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        try {
            byte[] imageData = qrGenerator.generate(data);
            return Utils.getDataUriForImage(imageData, qrGenerator.getImageMimeType());
        } catch (QrGenerationException ex) {
            log.warn("Failed to generate 2FA QR code: {}", ex.getMessage());
            return null;
        }
    }

    /** True when {@code code} is a currently-valid TOTP for {@code secret}. */
    public boolean isValidCode(String secret, String code) {
        if (secret == null || code == null || code.isBlank()) {
            return false;
        }
        return codeVerifier.isValidCode(secret, code.trim());
    }
}
