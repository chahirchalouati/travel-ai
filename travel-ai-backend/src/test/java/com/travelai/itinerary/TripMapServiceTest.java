package com.travelai.itinerary;

import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.catalog.hotel.Hotel;
import com.travelai.catalog.hotel.HotelRepository;
import com.travelai.catalog.restaurant.Restaurant;
import com.travelai.catalog.restaurant.RestaurantRepository;
import com.travelai.destination.Destination;
import com.travelai.destination.DestinationRepository;
import com.travelai.itinerary.dto.TripMapResponse;
import com.travelai.itinerary.dto.TripMapStop;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TripMapServiceTest {

    private static final String USER = "user@example.com";

    @Mock private BookingRepository bookingRepository;
    @Mock private LiveItineraryRepository itineraryRepository;
    @Mock private ItinerarySegmentRepository segmentRepository;
    @Mock private HotelRepository hotelRepository;
    @Mock private RestaurantRepository restaurantRepository;
    @Mock private DestinationRepository destinationRepository;

    private TripMapService service;

    private final UUID bookingId = UUID.randomUUID();
    private final UUID itineraryId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new TripMapService(bookingRepository, itineraryRepository, segmentRepository,
                hotelRepository, restaurantRepository, destinationRepository);
    }

    // ── Fixtures ─────────────────────────────────────────────────────────────

    private Booking booking(String destination, LocalDate checkIn) {
        Booking booking = new Booking();
        booking.setDestination(destination);
        booking.setCheckIn(checkIn);
        return booking;
    }

    private LiveItinerary itinerary() {
        LiveItinerary itinerary = new LiveItinerary();
        itinerary.setBookingId(bookingId);
        ReflectionTestUtils.setField(itinerary, "id", itineraryId);
        return itinerary;
    }

    private ItinerarySegment segment(SegmentType type, UUID entityId, String label, Instant scheduledAt) {
        ItinerarySegment segment = new ItinerarySegment();
        ReflectionTestUtils.setField(segment, "id", UUID.randomUUID());
        segment.setItineraryId(itineraryId);
        segment.setSegmentType(type);
        segment.setEntityId(entityId);
        segment.setLabel(label);
        segment.setScheduledAt(scheduledAt);
        return segment;
    }

    private Hotel hotelAt(UUID id, String lat, String lng) {
        Hotel hotel = new Hotel();
        hotel.setId(id);
        hotel.setName("Hotel Blu");
        hotel.setLatitude(lat == null ? null : new BigDecimal(lat));
        hotel.setLongitude(lng == null ? null : new BigDecimal(lng));
        return hotel;
    }

    private Restaurant restaurantAt(UUID id, String lat, String lng) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        restaurant.setName("Trattoria");
        restaurant.setLatitude(lat == null ? null : new BigDecimal(lat));
        restaurant.setLongitude(lng == null ? null : new BigDecimal(lng));
        return restaurant;
    }

    private void stubOwnedTrip(Booking booking, List<ItinerarySegment> segments) {
        when(bookingRepository.findByIdAndUserEmail(bookingId, USER)).thenReturn(Optional.of(booking));
        when(itineraryRepository.findByBookingId(bookingId)).thenReturn(Optional.of(itinerary()));
        when(segmentRepository.findByItineraryId(itineraryId)).thenReturn(segments);
    }

    // ── Coordinate resolution ────────────────────────────────────────────────

    @Test
    @DisplayName("hotel and restaurant segments resolve to their own catalog coordinates")
    void resolvesCatalogCoordinates() {
        UUID hotelId = UUID.randomUUID();
        UUID restaurantId = UUID.randomUUID();
        LocalDate checkIn = LocalDate.of(2026, 7, 10);
        Instant day1 = checkIn.atStartOfDay(ZoneOffset.UTC).toInstant();

        stubOwnedTrip(booking("Roma", checkIn), List.of(
                segment(SegmentType.HOTEL, hotelId, "Hotel stay", day1),
                segment(SegmentType.RESTAURANT, restaurantId, "Dinner", day1)));
        when(hotelRepository.findAllById(List.of(hotelId)))
                .thenReturn(List.of(hotelAt(hotelId, "41.9028", "12.4964")));
        when(restaurantRepository.findAllById(List.of(restaurantId)))
                .thenReturn(List.of(restaurantAt(restaurantId, "41.8902", "12.4922")));

        TripMapResponse response = service.getTripMap(USER, bookingId);

        assertThat(response.missingCoords()).isZero();
        assertThat(response.stops()).hasSize(2);
        TripMapStop hotelStop = response.stops().get(0);
        assertThat(hotelStop.type()).isEqualTo("HOTEL");
        assertThat(hotelStop.title()).isEqualTo("Hotel stay");
        assertThat(hotelStop.lat()).isEqualByComparingTo("41.9028");
        assertThat(hotelStop.lng()).isEqualByComparingTo("12.4964");
        assertThat(hotelStop.day()).isEqualTo(1);
        assertThat(hotelStop.date()).isEqualTo(checkIn);
    }

    @Test
    @DisplayName("flight segments fall back to the booking destination's coordinates")
    void flightFallsBackToDestination() {
        UUID flightId = UUID.randomUUID();
        stubOwnedTrip(booking("Roma", LocalDate.of(2026, 7, 10)),
                List.of(segment(SegmentType.FLIGHT, flightId, "Flight", null)));
        Destination roma = Destination.builder()
                .name("Roma")
                .country("Italy")
                .latitude(new BigDecimal("41.902"))
                .longitude(new BigDecimal("12.496"))
                .build();
        when(destinationRepository.findFirstByNameIgnoreCaseAndActiveTrue("Roma"))
                .thenReturn(Optional.of(roma));

        TripMapResponse response = service.getTripMap(USER, bookingId);

        assertThat(response.missingCoords()).isZero();
        assertThat(response.stops()).hasSize(1);
        assertThat(response.stops().get(0).lat()).isEqualByComparingTo("41.902");
        assertThat(response.stops().get(0).lng()).isEqualByComparingTo("12.496");
    }

    @Test
    @DisplayName("hotel without coordinates falls back to destination before being counted missing")
    void hotelWithoutCoordinatesUsesDestinationFallback() {
        UUID hotelId = UUID.randomUUID();
        stubOwnedTrip(booking("Napoli", null),
                List.of(segment(SegmentType.HOTEL, hotelId, "Hotel stay", null)));
        when(hotelRepository.findAllById(List.of(hotelId)))
                .thenReturn(List.of(hotelAt(hotelId, null, null)));
        when(destinationRepository.findFirstByNameIgnoreCaseAndActiveTrue("Napoli"))
                .thenReturn(Optional.of(Destination.builder()
                        .name("Napoli").country("Italy")
                        .latitude(new BigDecimal("40.852"))
                        .longitude(new BigDecimal("14.268"))
                        .build()));

        TripMapResponse response = service.getTripMap(USER, bookingId);

        assertThat(response.missingCoords()).isZero();
        assertThat(response.stops()).hasSize(1);
        assertThat(response.stops().get(0).lat()).isEqualByComparingTo("40.852");
    }

    @Test
    @DisplayName("segments without any resolvable coordinates are skipped and counted")
    void countsUnresolvableSegments() {
        UUID hotelId = UUID.randomUUID();
        UUID flightId = UUID.randomUUID();
        stubOwnedTrip(booking("Atlantis", null), List.of(
                segment(SegmentType.HOTEL, hotelId, "Hotel stay", null),
                segment(SegmentType.FLIGHT, flightId, "Flight", null)));
        when(hotelRepository.findAllById(List.of(hotelId)))
                .thenReturn(List.of(hotelAt(hotelId, "45.438", "12.327")));
        // Unknown destination: no fallback coordinates.
        when(destinationRepository.findFirstByNameIgnoreCaseAndActiveTrue("Atlantis"))
                .thenReturn(Optional.empty());

        TripMapResponse response = service.getTripMap(USER, bookingId);

        assertThat(response.stops()).hasSize(1);
        assertThat(response.stops().get(0).type()).isEqualTo("HOTEL");
        assertThat(response.missingCoords()).isEqualTo(1);
    }

    // ── Day / ordering ───────────────────────────────────────────────────────

    @Test
    @DisplayName("stops are ordered by 1-based day relative to check-in")
    void ordersStopsByDay() {
        UUID hotelId = UUID.randomUUID();
        UUID restaurantId = UUID.randomUUID();
        LocalDate checkIn = LocalDate.of(2026, 7, 10);
        Instant day3 = checkIn.plusDays(2).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant day1 = checkIn.atStartOfDay(ZoneOffset.UTC).toInstant();

        stubOwnedTrip(booking("Roma", checkIn), List.of(
                segment(SegmentType.RESTAURANT, restaurantId, "Dinner", day3),
                segment(SegmentType.HOTEL, hotelId, "Hotel stay", day1)));
        when(hotelRepository.findAllById(List.of(hotelId)))
                .thenReturn(List.of(hotelAt(hotelId, "41.9", "12.5")));
        when(restaurantRepository.findAllById(List.of(restaurantId)))
                .thenReturn(List.of(restaurantAt(restaurantId, "41.89", "12.49")));

        TripMapResponse response = service.getTripMap(USER, bookingId);

        assertThat(response.stops()).extracting(TripMapStop::day).containsExactly(1, 3);
        assertThat(response.stops().get(1).date()).isEqualTo(checkIn.plusDays(2));
    }

    @Test
    @DisplayName("day defaults to 1 when check-in or schedule is unknown")
    void dayDefaultsToOne() {
        assertThat(TripMapService.dayOf(null, Instant.now())).isEqualTo(1);
        assertThat(TripMapService.dayOf(LocalDate.now(), null)).isEqualTo(1);
        // A segment scheduled before check-in is clamped to day 1.
        LocalDate checkIn = LocalDate.of(2026, 7, 10);
        Instant before = checkIn.minusDays(2).atStartOfDay(ZoneOffset.UTC).toInstant();
        assertThat(TripMapService.dayOf(checkIn, before)).isEqualTo(1);
    }

    // ── Ownership ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("throws not-found when the booking does not belong to the caller")
    void rejectsForeignBooking() {
        when(bookingRepository.findByIdAndUserEmail(bookingId, USER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getTripMap(USER, bookingId))
                .isInstanceOf(TravelAiException.class);
    }
}
