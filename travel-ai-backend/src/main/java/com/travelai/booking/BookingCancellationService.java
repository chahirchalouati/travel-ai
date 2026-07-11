package com.travelai.booking;

import com.travelai.auth.User;
import com.travelai.booking.dto.CancellationPreviewResponse;
import com.travelai.booking.dto.CancellationResultResponse;
import com.travelai.catalog.cruise.CruiseRepository;
import com.travelai.catalog.flight.FlightRepository;
import com.travelai.catalog.restaurant.RestaurantAvailabilityRepository;
import com.travelai.event.BookingCancelledEvent;
import com.travelai.payment.Payment;
import com.travelai.payment.PaymentRepository;
import com.travelai.payment.PaymentStatus;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Self-service booking cancellation with policy-based refunds.
 *
 * <p>Kept separate from {@link BookingService} so the create/confirm flow stays
 * untouched: this service owns the refund quote ({@link #preview}), the actual
 * cancellation ({@link #cancel}) including inventory restoration, and the
 * {@link BookingCancelledEvent} that drives the cancellation email.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BookingCancellationService {

    /** Machine-readable reasons a booking cannot be self-service cancelled. */
    static final String REASON_ALREADY_CANCELLED = "ALREADY_CANCELLED";
    static final String REASON_COMPLETED = "COMPLETED";
    static final String REASON_PAST_CHECK_IN = "PAST_CHECK_IN";
    static final String REASON_NO_CHECK_IN_DATE = "NO_CHECK_IN_DATE";

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final FlightRepository flightRepository;
    private final CruiseRepository cruiseRepository;
    private final RestaurantAvailabilityRepository restaurantAvailabilityRepository;
    private final ApplicationEventPublisher eventPublisher;

    /** Everything the policy says about cancelling a booking right now. */
    private record Quote(
            boolean cancellable,
            String notCancellableReason,
            long daysBeforeCheckIn,
            BigDecimal totalPaid,
            int refundPercent,
            BigDecimal refundAmount,
            Payment refundablePayment) {}

    /** Returns the refund quote for a booking the user owns, without cancelling it. */
    @Transactional(readOnly = true)
    public CancellationPreviewResponse preview(String email, UUID bookingId) {
        Booking booking = findOwned(email, bookingId);
        Quote quote = quote(booking);
        return new CancellationPreviewResponse(
                booking.getId(),
                quote.cancellable(),
                quote.notCancellableReason(),
                booking.getCheckIn(),
                quote.daysBeforeCheckIn(),
                quote.totalPaid(),
                quote.refundPercent(),
                quote.refundAmount(),
                CancellationPolicy.tiers());
    }

    /**
     * Cancels a booking the user owns: computes the refund per policy, marks it
     * PROCESSED immediately (the gateway is simulated), flips the booking to
     * CANCELLED, restores the inventory decremented at confirmation and emits a
     * {@link BookingCancelledEvent}. Cancelling twice yields a 409.
     */
    public CancellationResultResponse cancel(String email, UUID bookingId, String reason) {
        Booking booking = findOwned(email, bookingId);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw TravelAiException.conflict(ErrorCode.BOOKING_ALREADY_CANCELLED);
        }
        Quote quote = quote(booking);
        if (!quote.cancellable()) {
            throw TravelAiException.badRequest(ErrorCode.BOOKING_NOT_CANCELLABLE);
        }

        Refund refund = null;
        if (quote.refundAmount().signum() > 0 && quote.refundablePayment() != null) {
            refund = processRefund(booking, quote, reason);
        }

        boolean wasConfirmed = booking.getStatus() == BookingStatus.CONFIRMED;
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        if (wasConfirmed) {
            restoreInventory(saved);
        }

        publishCancelledEvent(saved, quote);
        log.info("Booking {} cancelled by {} — refund €{} ({}%)",
                saved.getId(), email, quote.refundAmount(), quote.refundPercent());

        return new CancellationResultResponse(
                bookingService.toResponse(saved),
                quote.refundAmount(),
                quote.refundPercent(),
                refund != null ? refund.getStatus() : null);
    }

    // ── internals ────────────────────────────────────────────────────────────

    private Booking findOwned(String email, UUID bookingId) {
        return bookingRepository.findByIdAndUserEmail(bookingId, email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));
    }

    private Quote quote(Booking booking) {
        List<Payment> completed = paymentRepository.findByBookingId(booking.getId()).stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .toList();
        BigDecimal totalPaid = completed.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Payment refundablePayment = completed.isEmpty() ? null : completed.getFirst();

        Optional<String> blocked = blockedReason(booking);
        if (blocked.isPresent()) {
            return new Quote(false, blocked.get(), 0,
                    totalPaid, CancellationPolicy.NO_REFUND_PERCENT,
                    CancellationPolicy.refundAmount(totalPaid, 0), refundablePayment);
        }

        long daysBefore = CancellationPolicy.daysBeforeStart(booking.getCheckIn(), LocalDate.now());
        int percent = CancellationPolicy.refundPercent(daysBefore);
        BigDecimal refundAmount = CancellationPolicy.refundAmount(totalPaid, percent);
        return new Quote(true, null, daysBefore, totalPaid, percent, refundAmount, refundablePayment);
    }

    /** Why this booking cannot be self-service cancelled, or empty when it can. */
    private Optional<String> blockedReason(Booking booking) {
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return Optional.of(REASON_ALREADY_CANCELLED);
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            return Optional.of(REASON_COMPLETED);
        }
        if (booking.getCheckIn() == null) {
            return Optional.of(REASON_NO_CHECK_IN_DATE);
        }
        if (booking.getCheckIn().isBefore(LocalDate.now())) {
            return Optional.of(REASON_PAST_CHECK_IN);
        }
        return Optional.empty();
    }

    /** Creates the PROCESSED refund record and flags the payment as (partially) refunded. */
    private Refund processRefund(Booking booking, Quote quote, String reason) {
        Refund refund = new Refund();
        refund.setBookingId(booking.getId());
        refund.setPaymentId(quote.refundablePayment().getId());
        refund.setAmount(quote.refundAmount());
        refund.setRefundPercent(quote.refundPercent());
        refund.setReason(reason);
        refund.setStatus(RefundStatus.PROCESSED); // simulated gateway: instant
        refund.setProcessedAt(LocalDateTime.now());
        Refund saved = refundRepository.save(refund);

        Payment payment = quote.refundablePayment();
        payment.setStatus(quote.refundPercent() >= CancellationPolicy.FULL_REFUND_PERCENT
                ? PaymentStatus.REFUNDED
                : PaymentStatus.PARTIALLY_REFUNDED);
        payment.setRefundedAt(LocalDateTime.now());
        paymentRepository.save(payment);
        return saved;
    }

    /**
     * Puts back the inventory that {@code BookingService.releaseInventory}
     * decremented at confirmation. Best-effort, mirroring the decrement side:
     * a missing catalog row is not fatal.
     */
    private void restoreInventory(Booking b) {
        int party = b.getPartySize() != null ? b.getPartySize() : 1;

        if (b.getFlightId() != null) {
            flightRepository.findById(b.getFlightId()).ifPresent(flight -> {
                flight.setSeatsAvailable((short) (flight.getSeatsAvailable() + party));
                flightRepository.save(flight);
            });
        }
        if (b.getCruiseId() != null) {
            cruiseRepository.findById(b.getCruiseId()).ifPresent(cruise -> {
                cruise.setCabinsAvailable(cruise.getCabinsAvailable() + 1);
                cruiseRepository.save(cruise);
            });
        }
        if (b.getRestaurantId() != null && b.getCheckIn() != null && b.getTimeSlot() != null) {
            parseSlot(b.getTimeSlot()).ifPresent(slot ->
                    restaurantAvailabilityRepository
                            .findByRestaurantIdAndDateAndTimeSlot(b.getRestaurantId(), b.getCheckIn(), slot)
                            .ifPresent(av -> {
                                av.setCoversAvailable((short) (av.getCoversAvailable() + party));
                                restaurantAvailabilityRepository.save(av);
                            }));
        }
    }

    private Optional<LocalTime> parseSlot(String raw) {
        try {
            return Optional.of(LocalTime.parse(raw.length() == 5 ? raw : raw.substring(0, 5)));
        } catch (RuntimeException ex) {
            log.warn("Unparseable booking time slot '{}'", raw);
            return Optional.empty();
        }
    }

    private void publishCancelledEvent(Booking booking, Quote quote) {
        User user = booking.getUser();
        eventPublisher.publishEvent(new BookingCancelledEvent(
                booking.getId(),
                user.getId(),
                user.getEmail(),
                user.getFirstName() + " " + user.getLastName(),
                booking.getDestination(),
                booking.getBookingReference(),
                quote.totalPaid(),
                quote.refundAmount(),
                quote.refundPercent()));
    }
}
