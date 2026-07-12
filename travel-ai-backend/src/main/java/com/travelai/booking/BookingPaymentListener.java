package com.travelai.booking;

import com.travelai.event.PaymentCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Confirms a booking once its payment completes. Keeps the booking lifecycle
 * (PENDING → CONFIRMED) driven by payment outcome rather than confirming at
 * creation time.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingPaymentListener {

    private final BookingService bookingService;

    @EventListener
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        if (event.bookingId() == null) {
            return;
        }
        log.info("Payment completed for booking {} — confirming", event.bookingId());
        bookingService.confirmAfterPayment(event.bookingId());
    }
}
