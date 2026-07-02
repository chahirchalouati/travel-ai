package com.travelai.revenue;

import com.travelai.booking.BookingRepository;
import com.travelai.booking.BookingStatus;
import com.travelai.revenue.dto.RevenueSummaryResponse;
import com.travelai.subscription.SubscriptionStatus;
import com.travelai.subscription.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Rolls up the platform's income across confirmed bookings (service fees,
 * commission markup, ancillary sales) and active subscriptions into a single
 * summary for the admin revenue dashboard.
 */
@Service
@RequiredArgsConstructor
public class RevenueService {

    private final BookingRepository bookingRepository;
    private final UserSubscriptionRepository subscriptionRepository;

    @Transactional(readOnly = true)
    public RevenueSummaryResponse summary() {
        BookingRepository.RevenueAggregate agg = bookingRepository.aggregateByStatus(BookingStatus.CONFIRMED);

        BigDecimal serviceFee = nz(agg.getServiceFee());
        BigDecimal commission = nz(agg.getCommission());
        BigDecimal ancillary = nz(agg.getAncillary());

        long activeSubscriptions = subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE);
        BigDecimal subscriptionRevenue = nz(subscriptionRepository.sumPricePaidByStatus(SubscriptionStatus.ACTIVE));

        BigDecimal total = serviceFee.add(commission).add(ancillary).add(subscriptionRevenue);

        return new RevenueSummaryResponse(
                agg.getBookings(),
                nz(agg.getGross()),
                serviceFee,
                commission,
                ancillary,
                activeSubscriptions,
                subscriptionRevenue,
                total);
    }

    private BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
