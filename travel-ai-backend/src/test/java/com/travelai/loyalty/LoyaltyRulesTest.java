package com.travelai.loyalty;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("LoyaltyRules")
class LoyaltyRulesTest {

    // --- Earn computation -----------------------------------------------

    @ParameterizedTest(name = "EUR {0} at {1} earns {2} pts")
    @CsvSource({
            "100.00, EXPLORER, 100",
            "10.99,  EXPLORER, 10",     // floor
            "0.99,   EXPLORER, 0",      // below 1 EUR earns nothing
            "100.00, VOYAGER,  125",    // 1.25x
            "10.99,  VOYAGER,  13",     // floor(13.7375)
            "100.00, ELITE,    150",    // 1.5x
            "100.50, ELITE,    150",    // floor(150.75)
    })
    void earnedPoints_appliesTierMultiplierAndFloors(String amount, LoyaltyTier tier, int expected) {
        assertThat(LoyaltyRules.earnedPoints(new BigDecimal(amount), tier)).isEqualTo(expected);
    }

    @Test
    @DisplayName("earn is zero for null or non-positive amounts")
    void earnedPoints_zeroForInvalidAmounts() {
        assertThat(LoyaltyRules.earnedPoints(null, LoyaltyTier.EXPLORER)).isZero();
        assertThat(LoyaltyRules.earnedPoints(BigDecimal.ZERO, LoyaltyTier.ELITE)).isZero();
        assertThat(LoyaltyRules.earnedPoints(new BigDecimal("-5"), LoyaltyTier.VOYAGER)).isZero();
    }

    // --- Tier thresholds --------------------------------------------------

    @ParameterizedTest(name = "{0} lifetime pts → {1}")
    @CsvSource({
            "0,    EXPLORER",
            "999,  EXPLORER",
            "1000, VOYAGER",
            "4999, VOYAGER",
            "5000, ELITE",
            "50000, ELITE",
    })
    void fromLifetimePoints_promotesAtThresholds(int lifetime, LoyaltyTier expected) {
        assertThat(LoyaltyTier.fromLifetimePoints(lifetime)).isEqualTo(expected);
    }

    @Test
    @DisplayName("next tier chain is EXPLORER → VOYAGER → ELITE → null")
    void next_tierChain() {
        assertThat(LoyaltyTier.EXPLORER.next()).isEqualTo(LoyaltyTier.VOYAGER);
        assertThat(LoyaltyTier.VOYAGER.next()).isEqualTo(LoyaltyTier.ELITE);
        assertThat(LoyaltyTier.ELITE.next()).isNull();
    }

    // --- Redemption -------------------------------------------------------

    @Test
    @DisplayName("100 points buy exactly 1 EUR of discount")
    void discountFor_conversionRate() {
        assertThat(LoyaltyRules.discountFor(500)).isEqualByComparingTo("5.00");
        assertThat(LoyaltyRules.discountFor(1250)).isEqualByComparingTo("12.50");
    }

    @Test
    @DisplayName("max redeemable is capped at 50% of the booking total")
    void maxRedeemablePoints_fiftyPercentCap() {
        // 50% of 100 EUR = 50 EUR = 5000 pts, balance is larger
        assertThat(LoyaltyRules.maxRedeemablePoints(new BigDecimal("100.00"), 10_000)).isEqualTo(5_000);
    }

    @Test
    @DisplayName("max redeemable is capped by the balance")
    void maxRedeemablePoints_balanceCap() {
        assertThat(LoyaltyRules.maxRedeemablePoints(new BigDecimal("1000.00"), 700)).isEqualTo(700);
    }

    @Test
    @DisplayName("returns 0 when the redeemable amount is under the 500-point minimum")
    void maxRedeemablePoints_belowMinimumIsZero() {
        // balance below minimum
        assertThat(LoyaltyRules.maxRedeemablePoints(new BigDecimal("100.00"), 499)).isZero();
        // cap below minimum: 50% of 4 EUR = 200 pts < 500
        assertThat(LoyaltyRules.maxRedeemablePoints(new BigDecimal("4.00"), 10_000)).isZero();
    }

    @Test
    @DisplayName("returns 0 for empty balance or non-positive totals")
    void maxRedeemablePoints_zeroForInvalidInput() {
        assertThat(LoyaltyRules.maxRedeemablePoints(new BigDecimal("100.00"), 0)).isZero();
        assertThat(LoyaltyRules.maxRedeemablePoints(BigDecimal.ZERO, 10_000)).isZero();
        assertThat(LoyaltyRules.maxRedeemablePoints(null, 10_000)).isZero();
    }
}
