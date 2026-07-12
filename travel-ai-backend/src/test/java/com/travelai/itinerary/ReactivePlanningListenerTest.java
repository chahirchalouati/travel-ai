package com.travelai.itinerary;

import com.travelai.ai.planning.FlightAgent;
import com.travelai.ai.planning.HotelAgent;
import com.travelai.ai.planning.RestaurantAgent;
import com.travelai.ai.planning.dto.FlightOption;
import com.travelai.ai.planning.dto.HotelOption;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.itinerary.events.ItineraryEventDetectedEvent;
import com.travelai.itinerary.events.ItineraryProposalReadyEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReactivePlanningListenerTest {

    @Mock private ItinerarySegmentRepository segmentRepository;
    @Mock private ItineraryProposalRepository proposalRepository;
    @Mock private ProposedChangeRepository changeRepository;
    @Mock private LiveItineraryRepository itineraryRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private FlightAgent flightAgent;
    @Mock private HotelAgent hotelAgent;
    @Mock private RestaurantAgent restaurantAgent;
    @Mock(answer = Answers.RETURNS_DEEP_STUBS) private ChatClient chatClient;
    @Mock private ApplicationEventPublisher eventPublisher;

    private ReactivePlanningListener listener;

    private final UUID segmentId = UUID.randomUUID();
    private final UUID itineraryId = UUID.randomUUID();
    private final UUID bookingId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        listener = new ReactivePlanningListener(
                segmentRepository, proposalRepository, changeRepository, itineraryRepository,
                bookingRepository, flightAgent, hotelAgent, restaurantAgent, chatClient, eventPublisher);
    }

    private ItinerarySegment segment(SegmentType type) {
        ItinerarySegment segment = new ItinerarySegment();
        ReflectionTestUtils.setField(segment, "id", segmentId);
        segment.setItineraryId(itineraryId);
        segment.setSegmentType(type);
        segment.setCurrentStatus(SegmentStatus.DELAYED);
        return segment;
    }

    private LiveItinerary itinerary() {
        LiveItinerary itinerary = new LiveItinerary();
        ReflectionTestUtils.setField(itinerary, "id", itineraryId);
        itinerary.setBookingId(bookingId);
        return itinerary;
    }

    private Booking booking() {
        Booking b = new Booking();
        b.setDestination("Rome");
        b.setCheckIn(LocalDate.now().plusDays(10));
        b.setCheckOut(LocalDate.now().plusDays(14));
        b.setFlightAmount(new BigDecimal("200.00"));
        b.setHotelAmount(new BigDecimal("600.00"));
        b.setRestaurantAmount(new BigDecimal("120.00"));
        b.setTotalAmount(new BigDecimal("920.00"));
        return b;
    }

    private void wireLookups(SegmentType type) {
        when(segmentRepository.findById(segmentId)).thenReturn(Optional.of(segment(type)));
        when(itineraryRepository.findById(itineraryId)).thenReturn(Optional.of(itinerary()));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking()));
    }

    private void expectProposalSaved() {
        when(proposalRepository.save(any(ItineraryProposal.class))).thenAnswer(i -> i.getArgument(0));
    }

    private ItineraryEventDetectedEvent event() {
        return new ItineraryEventDetectedEvent(
                UUID.randomUUID(), segmentId, itineraryId, "traveler@example.com", "MANUAL");
    }

    @Test
    @DisplayName("flight disruption with an available alternative persists a REPLACE_FLIGHT proposal")
    void flightDisruption_createsReplaceFlightProposal() {
        wireLookups(SegmentType.FLIGHT);
        expectProposalSaved();
        UUID newFlightId = UUID.randomUUID();
        when(flightAgent.findOptions(any())).thenReturn(List.of(new FlightOption(
                newFlightId, "ITA Airways", "FCO", "JFK", null, null, new BigDecimal("260.00"), 12)));

        listener.onEventDetected(event());

        ArgumentCaptor<ProposedChange> change = ArgumentCaptor.forClass(ProposedChange.class);
        verify(changeRepository).save(change.capture());
        assertThat(change.getValue().getChangeType()).isEqualTo(ProposedChangeType.REPLACE_FLIGHT);
        assertThat(change.getValue().getReplacementEntityId()).isEqualTo(newFlightId);
        // cost delta = 260 - 200 = 60
        assertThat(change.getValue().getCostDelta()).isEqualByComparingTo("60.00");
        verify(eventPublisher).publishEvent(any(ItineraryProposalReadyEvent.class));
    }

    @Test
    @DisplayName("hotel disruption with an available alternative persists a REPLACE_HOTEL proposal")
    void hotelDisruption_createsReplaceHotelProposal() {
        wireLookups(SegmentType.HOTEL);
        expectProposalSaved();
        UUID newHotelId = UUID.randomUUID();
        when(hotelAgent.findOptions(any())).thenReturn(List.of(new HotelOption(
                newHotelId, "Hotel Roma", "Rome", new BigDecimal("150.00"), new BigDecimal("550.00"), 4.5,
                41.9028, 12.4964)));

        listener.onEventDetected(event());

        ArgumentCaptor<ProposedChange> change = ArgumentCaptor.forClass(ProposedChange.class);
        verify(changeRepository).save(change.capture());
        assertThat(change.getValue().getChangeType()).isEqualTo(ProposedChangeType.REPLACE_HOTEL);
        assertThat(change.getValue().getReplacementEntityId()).isEqualTo(newHotelId);
        // cost delta = 550 - 600 = -50 (cheaper)
        assertThat(change.getValue().getCostDelta()).isEqualByComparingTo("-50.00");
        verify(eventPublisher).publishEvent(any(ItineraryProposalReadyEvent.class));
    }

    @Test
    @DisplayName("no alternative found persists nothing and publishes no proposal-ready event")
    void noAlternative_persistsNothing() {
        wireLookups(SegmentType.FLIGHT);
        when(flightAgent.findOptions(any())).thenReturn(List.of());

        listener.onEventDetected(event());

        verify(proposalRepository, never()).save(any());
        verify(changeRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any(ItineraryProposalReadyEvent.class));
    }

    @Test
    @DisplayName("missing segment is a safe no-op")
    void missingSegment_noOp() {
        when(segmentRepository.findById(segmentId)).thenReturn(Optional.empty());
        when(itineraryRepository.findById(itineraryId)).thenReturn(Optional.of(itinerary()));

        listener.onEventDetected(event());

        verify(proposalRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }
}
