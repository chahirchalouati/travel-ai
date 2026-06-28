package com.travelai.booking;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.booking.dto.*;
import com.travelai.notification.events.BookingConfirmedEvent;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingTravelerRepository travelerRepository;
    private final WaitlistEntryRepository waitlistRepository;
    private final UserRepository userRepository;
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
        booking.setDestination(req.destination());
        booking.setCheckIn(req.checkIn());
        booking.setCheckOut(req.checkOut());
        booking.setTotalAmount(req.totalAmount());
        booking.setHotelAmount(req.hotelAmount());
        booking.setRestaurantAmount(req.restaurantAmount());
        booking.setFlightAmount(req.flightAmount());
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setBookingReference("TRV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        Booking saved = bookingRepository.save(booking);

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

        eventPublisher.publishEvent(new BookingConfirmedEvent(
                saved.getId(),
                user.getId(),
                user.getEmail(),
                user.getFirstName() + " " + user.getLastName(),
                saved.getDestination(),
                saved.getTotalAmount(),
                null));

        return toResponse(saved);
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

    public BookingResponse cancelBooking(String email, UUID bookingId) {
        Booking booking = bookingRepository.findByIdAndUserEmail(bookingId, email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));
        booking.setStatus(BookingStatus.CANCELLED);
        return toResponse(bookingRepository.save(booking));
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

    private BookingResponse toResponse(Booking b) {
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
                b.getDestination(),
                b.getStatus(),
                b.getTotalAmount(),
                b.getHotelAmount(),
                b.getRestaurantAmount(),
                b.getFlightAmount(),
                b.getBookingReference(),
                b.getCheckIn(),
                b.getCheckOut(),
                travelers,
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
