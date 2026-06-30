package com.travelai.itinerary;

import com.travelai.ai.planning.AiRateLimiter;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.itinerary.dto.ReportEventRequest;
import com.travelai.itinerary.events.ItineraryApprovedEvent;
import com.travelai.itinerary.events.ItineraryEventDetectedEvent;
import com.travelai.messaging.MessagingService;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LiveItineraryServiceTest {

    @Mock private LiveItineraryRepository itineraryRepository;
    @Mock private ItinerarySegmentRepository segmentRepository;
    @Mock private ItineraryEventRepository eventRepository;
    @Mock private ItineraryProposalRepository proposalRepository;
    @Mock private ProposedChangeRepository changeRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private AiRateLimiter aiRateLimiter;
    @Mock private MessagingService messagingService;
    @Mock private ApplicationEventPublisher eventPublisher;

    private LiveItineraryService service;

    @BeforeEach
    void setUp() {
        service = new LiveItineraryService(
                itineraryRepository, segmentRepository, eventRepository, proposalRepository,
                changeRepository, bookingRepository, aiRateLimiter, messagingService, eventPublisher);
    }

    private Booking bookingWith(UUID hotelId, UUID flightId, UUID restaurantId) {
        Booking b = new Booking();
        b.setHotelId(hotelId);
        b.setFlightId(flightId);
        b.setRestaurantId(restaurantId);
        b.setCheckIn(LocalDate.now().plusDays(10));
        b.setDestination("Rome");
        return b;
    }

    @Test
    @DisplayName("initForBooking creates an itinerary and one segment per non-null booking component")
    void initForBooking_createsSegments() {
        UUID bookingId = UUID.randomUUID();
        when(itineraryRepository.existsByBookingId(bookingId)).thenReturn(false);
        when(bookingRepository.findById(bookingId))
                .thenReturn(Optional.of(bookingWith(UUID.randomUUID(), UUID.randomUUID(), null)));
        when(itineraryRepository.save(any(LiveItinerary.class))).thenAnswer(i -> i.getArgument(0));

        service.initForBooking(bookingId);

        verify(itineraryRepository).save(any(LiveItinerary.class));
        // hotel + flight set, restaurant null → exactly 2 segments
        verify(segmentRepository, times(2)).save(any(ItinerarySegment.class));
    }

    @Test
    @DisplayName("initForBooking is idempotent — skips when one already exists")
    void initForBooking_skipsWhenExists() {
        UUID bookingId = UUID.randomUUID();
        when(itineraryRepository.existsByBookingId(bookingId)).thenReturn(true);

        service.initForBooking(bookingId);

        verify(itineraryRepository, never()).save(any());
        verify(segmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("recordManualEvent persists the event, flags the segment and publishes a detected event")
    void recordManualEvent_publishesDetectedEvent() {
        String email = "traveler@example.com";
        UUID itineraryId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();
        UUID segmentId = UUID.randomUUID();

        LiveItinerary itinerary = new LiveItinerary();
        itinerary.setBookingId(bookingId);
        ReflectionTestUtils.setField(itinerary, "id", itineraryId);

        ItinerarySegment segment = new ItinerarySegment();
        segment.setItineraryId(itineraryId);
        segment.setSegmentType(SegmentType.HOTEL);
        segment.setCurrentStatus(SegmentStatus.ON_SCHEDULE);

        when(aiRateLimiter.tryAcquire(email)).thenReturn(true);
        when(itineraryRepository.findById(itineraryId)).thenReturn(Optional.of(itinerary));
        when(bookingRepository.findByIdAndUserEmail(bookingId, email)).thenReturn(Optional.of(new Booking()));
        when(segmentRepository.findById(segmentId)).thenReturn(Optional.of(segment));
        when(eventRepository.save(any(ItineraryEvent.class))).thenAnswer(i -> i.getArgument(0));

        service.recordManualEvent(email, itineraryId,
                new ReportEventRequest(segmentId, "Flight cancelled", null));

        assertThat(segment.getCurrentStatus()).isEqualTo(SegmentStatus.DELAYED);
        verify(eventRepository).save(any(ItineraryEvent.class));
        verify(eventPublisher).publishEvent(any(ItineraryEventDetectedEvent.class));
    }

    @Test
    @DisplayName("approve applies a replacement, marks the proposal approved and emits an approved event")
    void approve_appliesReplacementAndPublishes() {
        String email = "traveler@example.com";
        UUID proposalId = UUID.randomUUID();
        UUID itineraryId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();
        UUID segmentId = UUID.randomUUID();
        UUID newHotelId = UUID.randomUUID();

        ItineraryProposal proposal = new ItineraryProposal();
        proposal.setItineraryId(itineraryId);
        proposal.setStatus(ItineraryProposalStatus.PENDING_APPROVAL);
        ReflectionTestUtils.setField(proposal, "id", proposalId);

        LiveItinerary itinerary = new LiveItinerary();
        itinerary.setBookingId(bookingId);

        ProposedChange change = new ProposedChange();
        change.setProposalId(proposalId);
        change.setSegmentId(segmentId);
        change.setChangeType(ProposedChangeType.REPLACE_HOTEL);
        change.setReplacementEntityId(newHotelId);
        change.setReplacementLabel("Hotel Roma · Rome");

        ItinerarySegment segment = new ItinerarySegment();
        segment.setSegmentType(SegmentType.HOTEL);

        when(proposalRepository.findById(proposalId)).thenReturn(Optional.of(proposal));
        when(itineraryRepository.findById(itineraryId)).thenReturn(Optional.of(itinerary));
        when(bookingRepository.findByIdAndUserEmail(bookingId, email)).thenReturn(Optional.of(new Booking()));
        when(changeRepository.findByProposalId(proposalId)).thenReturn(List.of(change));
        when(segmentRepository.findById(segmentId)).thenReturn(Optional.of(segment));

        service.approve(email, proposalId);

        assertThat(proposal.getStatus()).isEqualTo(ItineraryProposalStatus.APPROVED);
        assertThat(segment.getEntityId()).isEqualTo(newHotelId);
        assertThat(segment.getCurrentStatus()).isEqualTo(SegmentStatus.REBOOKED);
        verify(messagingService).start(eq(email), any(), any());
        verify(eventPublisher).publishEvent(any(ItineraryApprovedEvent.class));
    }

    @Test
    @DisplayName("recordManualEvent on a booking owned by another user is forbidden")
    void recordManualEvent_foreignBooking_forbidden() {
        String email = "intruder@example.com";
        UUID itineraryId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();

        LiveItinerary itinerary = new LiveItinerary();
        itinerary.setBookingId(bookingId);
        ReflectionTestUtils.setField(itinerary, "id", itineraryId);

        when(itineraryRepository.findById(itineraryId)).thenReturn(Optional.of(itinerary));
        when(bookingRepository.findByIdAndUserEmail(bookingId, email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.recordManualEvent(email, itineraryId,
                new ReportEventRequest(UUID.randomUUID(), "tampering", null)))
                .isInstanceOf(TravelAiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ACCESS_DENIED);

        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("approve on a non-pending proposal is rejected as a validation error")
    void approve_nonPendingProposal_validationError() {
        String email = "traveler@example.com";
        UUID proposalId = UUID.randomUUID();
        UUID itineraryId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();

        ItineraryProposal proposal = new ItineraryProposal();
        proposal.setItineraryId(itineraryId);
        proposal.setStatus(ItineraryProposalStatus.APPROVED);

        LiveItinerary itinerary = new LiveItinerary();
        itinerary.setBookingId(bookingId);

        when(proposalRepository.findById(proposalId)).thenReturn(Optional.of(proposal));
        when(itineraryRepository.findById(itineraryId)).thenReturn(Optional.of(itinerary));
        when(bookingRepository.findByIdAndUserEmail(bookingId, email)).thenReturn(Optional.of(new Booking()));

        assertThatThrownBy(() -> service.approve(email, proposalId))
                .isInstanceOf(TravelAiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.VALIDATION_ERROR);

        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("reject marks the proposal rejected without applying changes")
    void reject_marksRejected() {
        String email = "traveler@example.com";
        UUID proposalId = UUID.randomUUID();
        UUID itineraryId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();

        ItineraryProposal proposal = new ItineraryProposal();
        proposal.setItineraryId(itineraryId);
        proposal.setStatus(ItineraryProposalStatus.PENDING_APPROVAL);

        LiveItinerary itinerary = new LiveItinerary();
        itinerary.setBookingId(bookingId);

        when(proposalRepository.findById(proposalId)).thenReturn(Optional.of(proposal));
        when(itineraryRepository.findById(itineraryId)).thenReturn(Optional.of(itinerary));
        when(bookingRepository.findByIdAndUserEmail(bookingId, email)).thenReturn(Optional.of(new Booking()));

        service.reject(email, proposalId);

        assertThat(proposal.getStatus()).isEqualTo(ItineraryProposalStatus.REJECTED);
        verify(segmentRepository, never()).save(any());
    }
}
