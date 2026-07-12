package com.travelai.revenue;

import com.travelai.booking.BookingRepository;
import com.travelai.booking.BookingStatus;
import com.travelai.revenue.dto.RevenueSummaryResponse;
import com.travelai.subscription.SubscriptionStatus;
import com.travelai.subscription.UserSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RevenueServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private UserSubscriptionRepository subscriptionRepository;

    private RevenueService service;

    @BeforeEach
    void setUp() {
        service = new RevenueService(bookingRepository, subscriptionRepository);
    }

    private BookingRepository.RevenueAggregate aggregate(
            long bookings, String gross, String fee, String commission, String ancillary) {
        return new BookingRepository.RevenueAggregate() {
            public long getBookings() { return bookings; }
            public BigDecimal getGross() { return new BigDecimal(gross); }
            public BigDecimal getServiceFee() { return new BigDecimal(fee); }
            public BigDecimal getCommission() { return new BigDecimal(commission); }
            public BigDecimal getAncillary() { return new BigDecimal(ancillary); }
        };
    }

    @Test
    @DisplayName("summary sums every income stream into the platform total")
    void summary_sumsAllStreams() {
        when(bookingRepository.aggregateByStatus(BookingStatus.CONFIRMED))
                .thenReturn(aggregate(4, "2000.00", "60.00", "120.00", "45.00"));
        when(subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE)).thenReturn(3L);
        when(subscriptionRepository.sumPricePaidByStatus(SubscriptionStatus.ACTIVE))
                .thenReturn(new BigDecimal("117.00"));

        RevenueSummaryResponse res = service.summary();

        assertThat(res.confirmedBookings()).isEqualTo(4);
        assertThat(res.grossBookingValue()).isEqualByComparingTo("2000.00");
        assertThat(res.serviceFeeRevenue()).isEqualByComparingTo("60.00");
        assertThat(res.commissionRevenue()).isEqualByComparingTo("120.00");
        assertThat(res.ancillaryRevenue()).isEqualByComparingTo("45.00");
        assertThat(res.activeSubscriptions()).isEqualTo(3);
        assertThat(res.subscriptionRevenue()).isEqualByComparingTo("117.00");
        // 60 + 120 + 45 + 117 = 342 (gross booking value is NOT platform revenue)
        assertThat(res.totalPlatformRevenue()).isEqualByComparingTo("342.00");
    }

    @Test
    @DisplayName("summary treats null aggregates as zero")
    void summary_handlesNulls() {
        when(bookingRepository.aggregateByStatus(BookingStatus.CONFIRMED))
                .thenReturn(aggregate(0, "0", "0", "0", "0"));
        when(subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE)).thenReturn(0L);
        when(subscriptionRepository.sumPricePaidByStatus(SubscriptionStatus.ACTIVE)).thenReturn(null);

        RevenueSummaryResponse res = service.summary();

        assertThat(res.totalPlatformRevenue()).isEqualByComparingTo("0");
        assertThat(res.subscriptionRevenue()).isEqualByComparingTo("0");
    }
}
