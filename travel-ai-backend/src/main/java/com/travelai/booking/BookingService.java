package com.travelai.booking;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.booking.dto.*;
import com.travelai.catalog.cruise.CruiseRepository;
import com.travelai.catalog.flight.FlightRepository;
import com.travelai.catalog.restaurant.RestaurantAvailabilityRepository;
import com.travelai.loyalty.LoyaltyService;
import com.travelai.notification.events.BookingConfirmedEvent;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BookingService {

    private static final DateTimeFormatter ICS_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final BookingRepository bookingRepository;
    private final BookingTravelerRepository travelerRepository;
    private final WaitlistEntryRepository waitlistRepository;
    private final UserRepository userRepository;
    private final FlightRepository flightRepository;
    private final CruiseRepository cruiseRepository;
    private final RestaurantAvailabilityRepository restaurantAvailabilityRepository;
    private final LoyaltyService loyaltyService;
    private final RefundRepository refundRepository;
    private final ApplicationEventPublisher eventPublisher;

    public BookingResponse createBooking(String userEmail, CreateBookingRequest req) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setProposalId(req.proposalId());
        booking.setHotelId(req.hotelId());
        booking.setRestaurantId(req.restaurantId());
        booking.setFlightId(req.flightId());
        booking.setCruiseId(req.cruiseId());
        booking.setDestination(req.destination());
        booking.setCheckIn(req.checkIn());
        booking.setCheckOut(req.checkOut());
        booking.setTotalAmount(req.totalAmount());
        booking.setHotelAmount(req.hotelAmount());
        booking.setRestaurantAmount(req.restaurantAmount());
        booking.setFlightAmount(req.flightAmount());
        booking.setCruiseAmount(req.cruiseAmount());
        booking.setFareClass(req.fareClass());
        booking.setTimeSlot(req.timeSlot());
        booking.setCabinCategory(req.cabinCategory());
        booking.setPartySize(req.partySize());
        booking.setTripGroupId(req.tripGroupId());
        // Awaiting payment — confirmation happens once payment completes
        // (see BookingPaymentListener).
        booking.setStatus(BookingStatus.PENDING);
        booking.setBookingReference("TRV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        Booking saved = bookingRepository.save(booking);

        // Loyalty redemption: like the promo discount, the points discount is already
        // subtracted from totalAmount by the client; here we validate the rules and
        // deduct the points (throws 400, rolling the booking back, when invalid).
        if (req.redeemPoints() != null && req.redeemPoints() > 0) {
            loyaltyService.redeemForBooking(user, req.redeemPoints(), req.totalAmount(), saved.getId());
        }

        if (req.travelers() != null) {
            for (TravelerRequest t : req.travelers()) {
                BookingTraveler traveler = new BookingTraveler();
                traveler.setBooking(saved);
                traveler.setFirstName(t.firstName());
                traveler.setLastName(t.lastName());
                traveler.setDocumentNumber(t.documentNumber());
                traveler.setPrimary(t.primary());
                travelerRepository.save(traveler);
                saved.getTravelers().add(traveler);
            }
        }

        return toResponse(saved);
    }

    /**
     * Confirms a booking once its payment completes and announces it. Invoked by
     * {@link BookingPaymentListener}; no-op if the booking is missing or already
     * past the pending stage.
     */
    public void confirmAfterPayment(UUID bookingId) {
        bookingRepository.findById(bookingId)
                .filter(b -> b.getStatus() == BookingStatus.PENDING)
                .ifPresent(booking -> {
                    booking.setStatus(BookingStatus.CONFIRMED);
                    Booking saved = bookingRepository.save(booking);
                    releaseInventory(saved);
                    User user = saved.getUser();
                    eventPublisher.publishEvent(new BookingConfirmedEvent(
                            saved.getId(),
                            user.getId(),
                            user.getEmail(),
                            user.getFirstName() + " " + user.getLastName(),
                            saved.getDestination(),
                            saved.getTotalAmount(),
                            null));
                });
    }

    /**
     * Decrements the booked vertical's remaining inventory once a booking is
     * confirmed. Each decrement is clamped at zero and best-effort: a missing
     * catalog row is logged, not fatal, so confirmation never fails on stale data.
     */
    private void releaseInventory(Booking b) {
        int party = b.getPartySize() != null ? b.getPartySize() : 1;

        if (b.getFlightId() != null) {
            flightRepository.findById(b.getFlightId()).ifPresent(flight -> {
                short remaining = (short) Math.max(0, flight.getSeatsAvailable() - party);
                flight.setSeatsAvailable(remaining);
                flightRepository.save(flight);
            });
        }
        if (b.getCruiseId() != null) {
            cruiseRepository.findById(b.getCruiseId()).ifPresent(cruise -> {
                cruise.setCabinsAvailable(Math.max(0, cruise.getCabinsAvailable() - 1));
                cruiseRepository.save(cruise);
            });
        }
        if (b.getRestaurantId() != null && b.getCheckIn() != null && b.getTimeSlot() != null) {
            parseSlot(b.getTimeSlot()).ifPresent(slot ->
                    restaurantAvailabilityRepository
                            .findByRestaurantIdAndDateAndTimeSlot(b.getRestaurantId(), b.getCheckIn(), slot)
                            .ifPresent(av -> {
                                av.setCoversAvailable((short) Math.max(0, av.getCoversAvailable() - party));
                                restaurantAvailabilityRepository.save(av);
                            }));
        }
    }

    private java.util.Optional<LocalTime> parseSlot(String raw) {
        try {
            return java.util.Optional.of(LocalTime.parse(raw.length() == 5 ? raw : raw.substring(0, 5)));
        } catch (RuntimeException ex) {
            log.warn("Unparseable booking time slot '{}'", raw);
            return java.util.Optional.empty();
        }
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getMyBookings(String email, Pageable pageable) {
        return bookingRepository.findByUserEmail(email, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBooking(String email, UUID bookingId) {
        return bookingRepository.findByIdAndUserEmail(bookingId, email)
                .map(this::toResponse)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));
    }

    public WaitlistEntryResponse joinWaitlist(String email, JoinWaitlistRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
        WaitlistEntry entry = new WaitlistEntry();
        entry.setUser(user);
        entry.setHotelId(req.hotelId());
        entry.setRestaurantId(req.restaurantId());
        entry.setFlightId(req.flightId());
        return toWaitlistResponse(waitlistRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public List<WaitlistEntryResponse> getMyWaitlist(String email) {
        return waitlistRepository.findByUserEmail(email).stream()
                .map(this::toWaitlistResponse)
                .toList();
    }

    /**
     * Builds a minimal valid iCalendar (VCALENDAR/VEVENT) document for a booking
     * the given user owns. Throws BOOKING_NOT_FOUND if it does not belong to them.
     */
    @Transactional(readOnly = true)
    public String icsForBooking(String email, UUID bookingId) {
        Booking b = bookingRepository.findByIdAndUserEmail(bookingId, email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));

        String destination = b.getDestination() != null ? b.getDestination() : "";
        String reference = b.getBookingReference() != null ? b.getBookingReference() : "";

        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//TravelAI//Booking//EN\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:PUBLISH\r\n");
        sb.append("BEGIN:VEVENT\r\n");
        sb.append("UID:").append(b.getId()).append("\r\n");
        sb.append("SUMMARY:").append(escapeIcs("TravelAI · " + destination)).append("\r\n");

        LocalDate checkIn = b.getCheckIn();
        if (checkIn != null) {
            LocalDate checkOut = b.getCheckOut() != null ? b.getCheckOut() : checkIn.plusDays(1);
            sb.append("DTSTART;VALUE=DATE:").append(checkIn.format(ICS_DATE)).append("\r\n");
            sb.append("DTEND;VALUE=DATE:").append(checkOut.format(ICS_DATE)).append("\r\n");
        }

        sb.append("DESCRIPTION:").append(escapeIcs("Prenotazione " + reference)).append("\r\n");
        sb.append("LOCATION:").append(escapeIcs(destination)).append("\r\n");
        sb.append("END:VEVENT\r\n");
        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    private static String escapeIcs(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\n", "\\n");
    }

    /** Package-private so {@link BookingCancellationService} can reuse the mapping. */
    BookingResponse toResponse(Booking b) {
        // Refund issued at cancellation time, surfaced on cancelled bookings only.
        java.math.BigDecimal refundAmount = b.getStatus() == BookingStatus.CANCELLED
                ? refundRepository.findFirstByBookingIdOrderByCreatedAtDesc(b.getId())
                        .map(Refund::getAmount)
                        .orElse(null)
                : null;
        List<TravelerResponse> travelers = b.getTravelers().stream()
                .map(t -> new TravelerResponse(
                        t.getId(),
                        t.getFirstName(),
                        t.getLastName(),
                        t.getDocumentNumber(),
                        t.isPrimary()))
                .toList();
        return new BookingResponse(
                b.getId(),
                b.getProposalId(),
                b.getHotelId(),
                b.getRestaurantId(),
                b.getFlightId(),
                b.getCruiseId(),
                b.getDestination(),
                b.getStatus(),
                b.getTotalAmount(),
                b.getHotelAmount(),
                b.getRestaurantAmount(),
                b.getFlightAmount(),
                b.getCruiseAmount(),
                b.getFareClass(),
                b.getTimeSlot(),
                b.getCabinCategory(),
                b.getPartySize(),
                b.getTripGroupId(),
                b.getBookingReference(),
                b.getCheckIn(),
                b.getCheckOut(),
                travelers,
                refundAmount,
                b.getCreatedAt());
    }

    private WaitlistEntryResponse toWaitlistResponse(WaitlistEntry e) {
        return new WaitlistEntryResponse(
                e.getId(),
                e.getHotelId(),
                e.getRestaurantId(),
                e.getFlightId(),
                e.getRequestedAt(),
                e.isNotified());
    }
}
