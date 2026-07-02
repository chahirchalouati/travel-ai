package com.travelai.auth;

import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TotpService — real TOTP algorithm wrapper")
class TotpServiceTest {

    private final TotpService totpService = new TotpService();

    @Test
    @DisplayName("a code generated for the current time-step is accepted")
    void currentCodeIsValid() throws Exception {
        String secret = totpService.generateSecret();
        long currentBucket = new SystemTimeProvider().getTime() / 30;
        String code = new DefaultCodeGenerator().generate(secret, currentBucket);

        assertThat(totpService.isValidCode(secret, code)).isTrue();
    }

    @Test
    @DisplayName("a wrong code is rejected")
    void wrongCodeIsInvalid() {
        String secret = totpService.generateSecret();

        assertThat(totpService.isValidCode(secret, "000000")).isFalse();
        assertThat(totpService.isValidCode(secret, "")).isFalse();
        assertThat(totpService.isValidCode(secret, null)).isFalse();
    }

    @Test
    @DisplayName("otpauth URI follows the TravelAI issuer format")
    void otpauthUriFormat() {
        String uri = totpService.otpauthUri("SECRET123", "user@example.com");

        assertThat(uri).isEqualTo(
                "otpauth://totp/TravelAI:user@example.com?secret=SECRET123&issuer=TravelAI");
    }

    @Test
    @DisplayName("qr data URI is a base64 PNG")
    void qrDataUri() {
        String secret = totpService.generateSecret();

        String dataUri = totpService.qrDataUri(secret, "user@example.com");

        assertThat(dataUri).startsWith("data:image/png;base64,");
    }
}
