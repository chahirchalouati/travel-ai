package com.travelai.itinerary;

import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.catalog.hotel.HotelRepository;
import com.travelai.catalog.restaurant.RestaurantRepository;
import com.travelai.destination.DestinationRepository;
import com.travelai.itinerary.dto.TripMapResponse;
import com.travelai.itinerary.dto.TripMapStop;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Builds the day-by-day map view of a trip: resolves each itinerary segment to
 * geographic coordinates (hotel/restaurant own coordinates, otherwise the
 * booking destination's coordinates) and orders the resulting stops by day.
 */
@Service
@RequiredArgsConstructor
public class TripMapService {

    private final BookingRepository bookingRepository;
    private final LiveItineraryRepository itineraryRepository;
    private final ItinerarySegmentRepository segmentRepository;
    private final HotelRepository hotelRepository;
    private final RestaurantRepository restaurantRepository;
    private final DestinationRepository destinationRepository;

    @Transactional(readOnly = true)
    public TripMapResponse getTripMap(String userEmail, UUID bookingId) {
        Booking booking = bookingRepository.findByIdAndUserEmail(bookingId, userEmail)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));
        LiveItinerary itinerary = itineraryRepository.findByBookingId(bookingId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ITINERARY_NOT_FOUND));

        List<ItinerarySegment> segments = segmentRepository.findByItineraryId(itinerary.getId())
                .stream()
                .sorted(Comparator
                        .comparing(ItinerarySegment::getScheduledAt,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparingInt(s -> s.getSegmentType().ordinal()))
                .toList();

        LatLng destinationFallback = resolveDestination(booking.getDestination());

        List<TripMapStop> stops = new ArrayList<>();
        int missingCoords = 0;
        for (ItinerarySegment segment : segments) {
            LatLng coords = resolveSegment(segment).orElse(destinationFallback);
            if (coords == null) {
                missingCoords++;
                continue;
            }
            stops.add(new TripMapStop(
                    segment.getId(),
                    dayOf(booking.getCheckIn(), segment.getScheduledAt()),
                    dateOf(booking.getCheckIn(), segment.getScheduledAt()),
                    titleOf(segment),
                    segment.getSegmentType().name(),
                    coords.lat(),
                    coords.lng()));
        }

        List<TripMapStop> ordered = stops.stream()
                .sorted(Comparator.comparingInt(TripMapStop::day))
                .toList();
        return new TripMapResponse(ordered, missingCoords);
    }

    /** Coordinates carried by the segment's own catalog entity, if any. */
    private Optional<LatLng> resolveSegment(ItinerarySegment segment) {
        return switch (segment.getSegmentType()) {
            case HOTEL -> hotelRepository.findById(segment.getEntityId())
                    .flatMap(h -> latLng(h.getLatitude(), h.getLongitude()));
            case RESTAURANT -> restaurantRepository.findById(segment.getEntityId())
                    .flatMap(r -> latLng(r.getLatitude(), r.getLongitude()));
            // Flights carry IATA codes only; they fall back to the trip destination.
            case FLIGHT -> Optional.empty();
        };
    }

    /** Coordinates of the booking's destination, used as a fallback. Null when unknown. */
    private LatLng resolveDestination(String destinationName) {
        if (destinationName == null || destinationName.isBlank()) {
            return null;
        }
        return destinationRepository.findFirstByNameIgnoreCaseAndActiveTrue(destinationName.trim())
                .flatMap(d -> latLng(d.getLatitude(), d.getLongitude()))
                .orElse(null);
    }

    private static Optional<LatLng> latLng(BigDecimal lat, BigDecimal lng) {
        if (lat == null || lng == null) {
            return Optional.empty();
        }
        return Optional.of(new LatLng(lat, lng));
    }

    /** 1-based trip day of a segment, relative to check-in; day 1 when unknown. */
    static int dayOf(LocalDate checkIn, Instant scheduledAt) {
        if (checkIn == null || scheduledAt == null) {
            return 1;
        }
        long diff = ChronoUnit.DAYS.between(checkIn, scheduledAt.atZone(ZoneOffset.UTC).toLocalDate());
        return (int) Math.max(diff, 0) + 1;
    }

    static LocalDate dateOf(LocalDate checkIn, Instant scheduledAt) {
        if (scheduledAt != null) {
            return scheduledAt.atZone(ZoneOffset.UTC).toLocalDate();
        }
        return checkIn;
    }

    private static String titleOf(ItinerarySegment segment) {
        return (segment.getLabel() == null || segment.getLabel().isBlank())
                ? segment.getSegmentType().name()
                : segment.getLabel();
    }

    private record LatLng(BigDecimal lat, BigDecimal lng) {
    }
}
