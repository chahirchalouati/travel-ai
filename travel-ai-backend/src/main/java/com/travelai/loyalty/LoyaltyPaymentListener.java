package com.travelai.loyalty;

import com.travelai.event.PaymentCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Awards loyalty points when a payment completes. Listens to the same
 * {@link PaymentCompletedEvent} that confirms bookings (see
 * {@code BookingPaymentListener}); failures are logged, never propagated, so a
 * loyalty hiccup can't break payment confirmation.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LoyaltyPaymentListener {

    private final LoyaltyService loyaltyService;

    @EventListener
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        if (event.userId() == null || event.amount() == null) {
            return;
        }
        try {
            loyaltyService.awardForPayment(event.userId(), event.bookingId(), event.amount());
        } catch (Exception e) {
            log.error("Loyalty: failed to award points for payment {} (user {}): {}",
                    event.paymentId(), event.userId(), e.getMessage(), e);
        }
    }
}
