package com.travelai.booking;

import com.travelai.auth.User;
import com.travelai.booking.dto.CancellationPreviewResponse;
import com.travelai.booking.dto.CancellationResultResponse;
import com.travelai.catalog.cruise.CruiseRepository;
import com.travelai.catalog.flight.Flight;
import com.travelai.catalog.flight.FlightRepository;
import com.travelai.catalog.restaurant.RestaurantAvailabilityRepository;
import com.travelai.event.BookingCancelledEvent;
import com.travelai.payment.Payment;
import com.travelai.payment.PaymentRepository;
import com.travelai.payment.PaymentStatus;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingCancellationService")
class BookingCancellationServiceTest {

    private static final String EMAIL = "traveler@example.com";

    @Mock private BookingRepository bookingRepository;
    @Mock private BookingService bookingService;
    @Mock private RefundRepository refundRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private FlightRepository flightRepository;
    @Mock private CruiseRepository cruiseRepository;
    @Mock private RestaurantAvailabilityRepository restaurantAvailabilityRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private BookingCancellationService service;

    private Booking booking(BookingStatus status, LocalDate checkIn) {
        User user = mock(User.class);
        lenient().when(user.getId()).thenReturn(UUID.randomUUID());
        lenient().when(user.getEmail()).thenReturn(EMAIL);
        lenient().when(user.getFirstName()).thenReturn("Ada");
        lenient().when(user.getLastName()).thenReturn("Lovelace");

        Booking b = new Booking();
        b.setUser(user);
        b.setStatus(status);
        b.setCheckIn(checkIn);
        b.setDestination("Rome");
        b.setBookingReference("TRV-TEST01");
        b.setTotalAmount(new BigDecimal("200.00"));
        return b;
    }

    private Payment completedPayment(String amount) {
        Payment p = mock(Payment.class);
        lenient().when(p.getId()).thenReturn(UUID.randomUUID());
        when(p.getStatus()).thenReturn(PaymentStatus.COMPLETED);
        when(p.getAmount()).thenReturn(new BigDecimal(amount));
        return p;
    }

    private void stubFound(Booking b) {
        when(bookingRepository.findByIdAndUserEmail(any(), eq(EMAIL))).thenReturn(Optional.of(b));
    }

    // ── cancel ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("confirmed booking 10 days out is fully refunded, cancelled and inventory restored")
    void cancel_confirmedFarOut_fullRefund() {
        Booking b = booking(BookingStatus.CONFIRMED, LocalDate.now().plusDays(10));
        UUID flightId = UUID.randomUUID();
        b.setFlightId(flightId);
        b.setPartySize(2);
        stubFound(b);
        Payment payment = completedPayment("200.00");
        when(paymentRepository.findByBookingId(any())).thenReturn(List.of(payment));
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(refundRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        Flight flight = new Flight();
        flight.setSeatsAvailable((short) 10);
        when(flightRepository.findById(flightId)).thenReturn(Optional.of(flight));

        CancellationResultResponse result = service.cancel(EMAIL, UUID.randomUUID(), "changed plans");

        assertThat(result.refundPercent()).isEqualTo(100);
        assertThat(result.refundAmount()).isEqualByComparingTo("200.00");
        assertThat(result.refundStatus()).isEqualTo(RefundStatus.PROCESSED);
        assertThat(b.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(flight.getSeatsAvailable()).isEqualTo((short) 12);
        verify(payment).setStatus(PaymentStatus.REFUNDED);

        ArgumentCaptor<Refund> refundCaptor = ArgumentCaptor.forClass(Refund.class);
        verify(refundRepository).save(refundCaptor.capture());
        Refund refund = refundCaptor.getValue();
        assertThat(refund.getAmount()).isEqualByComparingTo("200.00");
        assertThat(refund.getReason()).isEqualTo("changed plans");
        assertThat(refund.getProcessedAt()).isNotNull();

        ArgumentCaptor<BookingCancelledEvent> eventCaptor = ArgumentCaptor.forClass(BookingCancelledEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().refundAmount()).isEqualByComparingTo("200.00");
        assertThat(eventCaptor.getValue().userEmail()).isEqualTo(EMAIL);
    }

    @Test
    @DisplayName("boundary: 7 days before check-in still yields 100%")
    void cancel_sevenDaysOut_fullRefund() {
        Booking b = booking(BookingStatus.CONFIRMED, LocalDate.now().plusDays(7));
        stubFound(b);
        Payment payment = completedPayment("150.00");
        when(paymentRepository.findByBookingId(any())).thenReturn(List.of(payment));
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(refundRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CancellationResultResponse result = service.cancel(EMAIL, UUID.randomUUID(), null);

        assertThat(result.refundPercent()).isEqualTo(100);
        assertThat(result.refundAmount()).isEqualByComparingTo("150.00");
    }

    @Test
    @DisplayName("boundary: 2 days before check-in yields 50% and marks payment partially refunded")
    void cancel_twoDaysOut_halfRefund() {
        Booking b = booking(BookingStatus.CONFIRMED, LocalDate.now().plusDays(2));
        stubFound(b);
        Payment payment = completedPayment("200.00");
        when(paymentRepository.findByBookingId(any())).thenReturn(List.of(payment));
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(refundRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CancellationResultResponse result = service.cancel(EMAIL, UUID.randomUUID(), null);

        assertThat(result.refundPercent()).isEqualTo(50);
        assertThat(result.refundAmount()).isEqualByComparingTo("100.00");
        verify(payment).setStatus(PaymentStatus.PARTIALLY_REFUNDED);
    }

    @Test
    @DisplayName("1 day before check-in cancels with no refund and no refund record")
    void cancel_oneDayOut_noRefund() {
        Booking b = booking(BookingStatus.CONFIRMED, LocalDate.now().plusDays(1));
        stubFound(b);
        Payment payment = completedPayment("200.00");
        when(paymentRepository.findByBookingId(any())).thenReturn(List.of(payment));
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CancellationResultResponse result = service.cancel(EMAIL, UUID.randomUUID(), null);

        assertThat(result.refundPercent()).isZero();
        assertThat(result.refundAmount()).isEqualByComparingTo("0.00");
        assertThat(b.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        verify(refundRepository, never()).save(any());
        verify(payment, never()).setStatus(any());
    }

    @Test
    @DisplayName("unpaid PENDING booking cancels with zero refund and no inventory restore")
    void cancel_pendingUnpaid_zeroRefund() {
        Booking b = booking(BookingStatus.PENDING, LocalDate.now().plusDays(10));
        b.setFlightId(UUID.randomUUID());
        stubFound(b);
        when(paymentRepository.findByBookingId(any())).thenReturn(List.of());
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CancellationResultResponse result = service.cancel(EMAIL, UUID.randomUUID(), null);

        assertThat(result.refundAmount()).isEqualByComparingTo("0.00");
        assertThat(result.refundStatus()).isNull();
        assertThat(b.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        verify(refundRepository, never()).save(any());
        // inventory was never decremented for a PENDING booking, so nothing to restore
        verifyNoInteractions(flightRepository);
    }

    @Test
    @DisplayName("cancelling twice returns a 409 conflict")
    void cancel_alreadyCancelled_conflict() {
        Booking b = booking(BookingStatus.CANCELLED, LocalDate.now().plusDays(10));
        stubFound(b);

        assertThatThrownBy(() -> service.cancel(EMAIL, UUID.randomUUID(), null))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> {
                    assertThat(((TravelAiException) ex).getErrorCode())
                            .isEqualTo(ErrorCode.BOOKING_ALREADY_CANCELLED);
                    assertThat(((TravelAiException) ex).getHttpStatus()).isEqualTo(409);
                });
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("past booking cannot be cancelled")
    void cancel_pastCheckIn_rejected() {
        Booking b = booking(BookingStatus.CONFIRMED, LocalDate.now().minusDays(1));
        stubFound(b);
        when(paymentRepository.findByBookingId(any())).thenReturn(List.of());

        assertThatThrownBy(() -> service.cancel(EMAIL, UUID.randomUUID(), null))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> assertThat(((TravelAiException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_NOT_CANCELLABLE));
        verify(bookingRepository, never()).save(any());
        assertThat(b.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
    }

    @Test
    @DisplayName("unknown booking yields 404")
    void cancel_notFound() {
        when(bookingRepository.findByIdAndUserEmail(any(), eq(EMAIL))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancel(EMAIL, UUID.randomUUID(), null))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> assertThat(((TravelAiException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.BOOKING_NOT_FOUND));
    }

    // ── preview ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("preview quotes the refund without mutating anything")
    void preview_isReadOnly() {
        Booking b = booking(BookingStatus.CONFIRMED, LocalDate.now().plusDays(4));
        stubFound(b);
        Payment payment = completedPayment("199.99");
        when(paymentRepository.findByBookingId(any())).thenReturn(List.of(payment));

        CancellationPreviewResponse preview = service.preview(EMAIL, UUID.randomUUID());

        assertThat(preview.cancellable()).isTrue();
        assertThat(preview.refundPercent()).isEqualTo(50);
        assertThat(preview.refundAmount()).isEqualByComparingTo("100.00");
        assertThat(preview.totalPaid()).isEqualByComparingTo("199.99");
        assertThat(preview.daysBeforeCheckIn()).isEqualTo(4);
        assertThat(preview.tiers()).hasSize(3);
        assertThat(b.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        verify(bookingRepository, never()).save(any());
        verify(refundRepository, never()).save(any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    @DisplayName("preview of an already cancelled booking is flagged not cancellable")
    void preview_alreadyCancelled_notCancellable() {
        Booking b = booking(BookingStatus.CANCELLED, LocalDate.now().plusDays(10));
        stubFound(b);
        when(paymentRepository.findByBookingId(any())).thenReturn(List.of());

        CancellationPreviewResponse preview = service.preview(EMAIL, UUID.randomUUID());

        assertThat(preview.cancellable()).isFalse();
        assertThat(preview.notCancellableReason()).isEqualTo("ALREADY_CANCELLED");
        assertThat(preview.refundAmount()).isEqualByComparingTo("0.00");
    }
}
