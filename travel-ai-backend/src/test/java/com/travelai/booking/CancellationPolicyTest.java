package com.travelai.booking;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CancellationPolicy")
class CancellationPolicyTest {

    @ParameterizedTest(name = "{0} days before start → {1}% refund")
    @CsvSource({
            "30, 100",
            "8, 100",
            "7, 100",   // boundary: exactly 7 days = full refund
            "6, 50",
            "3, 50",
            "2, 50",    // boundary: exactly 2 days = 50%
            "1, 0",
            "0, 0",     // day-of check-in
            "-1, 0",    // already started
    })
    void refundPercent_followsTiers(long daysBefore, int expectedPercent) {
        assertThat(CancellationPolicy.refundPercent(daysBefore)).isEqualTo(expectedPercent);
    }

    @Test
    @DisplayName("daysBeforeStart counts whole days between today and check-in")
    void daysBeforeStart_countsWholeDays() {
        LocalDate today = LocalDate.of(2026, 7, 2);
        assertThat(CancellationPolicy.daysBeforeStart(LocalDate.of(2026, 7, 9), today)).isEqualTo(7);
        assertThat(CancellationPolicy.daysBeforeStart(LocalDate.of(2026, 7, 2), today)).isZero();
        assertThat(CancellationPolicy.daysBeforeStart(LocalDate.of(2026, 6, 30), today)).isEqualTo(-2);
    }

    @ParameterizedTest(name = "{0} paid at {1}% → {2}")
    @CsvSource({
            "200.00, 100, 200.00",
            "200.00, 50, 100.00",
            "199.99, 50, 100.00",  // rounds half-up on the cent
            "0.01, 50, 0.01",      // 0.005 rounds up
            "200.00, 0, 0.00",
    })
    void refundAmount_appliesPercentAndRoundsToCents(BigDecimal paid, int percent, BigDecimal expected) {
        assertThat(CancellationPolicy.refundAmount(paid, percent)).isEqualByComparingTo(expected);
    }

    @Test
    @DisplayName("refundAmount is zero for null paid amount (unpaid booking)")
    void refundAmount_nullPaid_isZero() {
        assertThat(CancellationPolicy.refundAmount(null, 100)).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("tiers expose the deadline ladder most generous first")
    void tiers_areOrderedForDisplay() {
        assertThat(CancellationPolicy.tiers()).containsExactly(
                new CancellationPolicy.Tier(7, 100),
                new CancellationPolicy.Tier(2, 50),
                new CancellationPolicy.Tier(0, 0));
    }
}
