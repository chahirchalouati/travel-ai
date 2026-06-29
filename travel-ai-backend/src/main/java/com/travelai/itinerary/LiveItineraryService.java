package com.travelai.itinerary;

import com.travelai.ai.planning.AiRateLimiter;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.itinerary.dto.ItineraryProposalResponse;
import com.travelai.itinerary.dto.LiveItineraryResponse;
import com.travelai.itinerary.dto.ProposedChangeResponse;
import com.travelai.itinerary.dto.ReportEventRequest;
import com.travelai.itinerary.dto.SegmentResponse;
import com.travelai.itinerary.events.ItineraryApprovedEvent;
import com.travelai.itinerary.events.ItineraryEventDetectedEvent;
import com.travelai.notification.events.BookingConfirmedEvent;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Core domain logic for the reactive living itinerary: creation on booking confirm,
 * user-reported disruptions, and the approval gate over AI re-plan proposals.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LiveItineraryService {

    private final LiveItineraryRepository itineraryRepository;
    private final ItinerarySegmentRepository segmentRepository;
    private final ItineraryEventRepository eventRepository;
    private final ItineraryProposalRepository proposalRepository;
    private final ProposedChangeRepository changeRepository;
    private final BookingRepository bookingRepository;
    private final AiRateLimiter aiRateLimiter;
    private final com.travelai.messaging.MessagingService messagingService;
    private final ApplicationEventPublisher eventPublisher;

    // ── Creation ────────────────────────────────────────────────────────────

    /** Creates a live itinerary for each newly confirmed booking. */
    @ApplicationModuleListener
    public void onBookingConfirmed(BookingConfirmedEvent event) {
        initForBooking(event.bookingId());
    }

    @Transactional
    public void initForBooking(UUID bookingId) {
        if (itineraryRepository.existsByBookingId(bookingId)) {
            return;
        }
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            log.warn("Cannot init live itinerary: booking {} not found", bookingId);
            return;
        }

        LiveItinerary itinerary = new LiveItinerary();
        itinerary.setBookingId(bookingId);
        itinerary.setWatchEnabled(true);
        LiveItinerary saved = itineraryRepository.save(itinerary);

        Instant scheduledAt = booking.getCheckIn() != null
                ? booking.getCheckIn().atStartOfDay(ZoneOffset.UTC).toInstant()
                : null;

        addSegment(saved.getId(), SegmentType.FLIGHT, booking.getFlightId(), "Flight", scheduledAt);
        addSegment(saved.getId(), SegmentType.HOTEL, booking.getHotelId(), "Hotel stay", scheduledAt);
        addSegment(saved.getId(), SegmentType.RESTAURANT, booking.getRestaurantId(), "Restaurant", scheduledAt);

        log.info("Live itinerary {} created for booking {}", saved.getId(), bookingId);
    }

    private void addSegment(UUID itineraryId, SegmentType type, UUID entityId, String label, Instant scheduledAt) {
        if (entityId == null) {
            return;
        }
        ItinerarySegment segment = new ItinerarySegment();
        segment.setItineraryId(itineraryId);
        segment.setSegmentType(type);
        segment.setEntityId(entityId);
        segment.setLabel(label);
        segment.setCurrentStatus(SegmentStatus.ON_SCHEDULE);
        segment.setScheduledAt(scheduledAt);
        segmentRepository.save(segment);
    }

    // ── Read ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LiveItineraryResponse getByBooking(String userEmail, UUID bookingId) {
        bookingRepository.findByIdAndUserEmail(bookingId, userEmail)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));
        LiveItinerary itinerary = itineraryRepository.findByBookingId(bookingId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ITINERARY_NOT_FOUND));
        return toResponse(itinerary);
    }

    @Transactional(readOnly = true)
    public List<ItineraryProposalResponse> listProposals(String userEmail, UUID itineraryId) {
        LiveItinerary itinerary = loadOwnedItinerary(userEmail, itineraryId);
        return proposalRepository.findByItineraryIdOrderByCreatedAtDesc(itinerary.getId())
                .stream().map(this::toProposalResponse).toList();
    }

    // ── Manual disruption trigger ─────────────────────────────────────────────

    @Transactional
    public void recordManualEvent(String userEmail, UUID itineraryId, ReportEventRequest request) {
        LiveItinerary itinerary = loadOwnedItinerary(userEmail, itineraryId);

        if (!aiRateLimiter.tryAcquire(userEmail)) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }

        ItinerarySegment segment = segmentRepository.findById(request.segmentId())
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ITINERARY_SEGMENT_NOT_FOUND));
        if (!segment.getItineraryId().equals(itinerary.getId())) {
            throw TravelAiException.notFound(ErrorCode.ITINERARY_SEGMENT_NOT_FOUND);
        }

        ItineraryEvent event = new ItineraryEvent();
        event.setSegmentId(segment.getId());
        event.setSource(EventSource.MANUAL);
        event.setDescription(request.description() == null ? "Disruption reported" : request.description());
        event.setDisruptionData(request.disruptionData());
        ItineraryEvent savedEvent = eventRepository.save(event);

        segment.setCurrentStatus(SegmentStatus.DELAYED);
        segmentRepository.save(segment);

        eventPublisher.publishEvent(new ItineraryEventDetectedEvent(
                savedEvent.getId(),
                segment.getId(),
                itinerary.getId(),
                userEmail,
                EventSource.MANUAL.name()));
    }

    // ── Webhook disruption trigger (external push, unauthenticated) ───────────

    @Transactional
    public void recordWebhookEvent(UUID segmentId, String description, String rawData) {
        ItinerarySegment segment = segmentRepository.findById(segmentId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ITINERARY_SEGMENT_NOT_FOUND));
        LiveItinerary itinerary = itineraryRepository.findById(segment.getItineraryId())
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ITINERARY_NOT_FOUND));
        Booking booking = bookingRepository.findById(itinerary.getBookingId()).orElse(null);
        String userEmail = (booking != null && booking.getUser() != null)
                ? booking.getUser().getEmail() : null;

        ItineraryEvent event = new ItineraryEvent();
        event.setSegmentId(segment.getId());
        event.setSource(EventSource.WEBHOOK);
        event.setDescription(description == null ? "External disruption" : description);
        event.setDisruptionData(rawData);
        ItineraryEvent savedEvent = eventRepository.save(event);

        segment.setCurrentStatus(SegmentStatus.DELAYED);
        segmentRepository.save(segment);

        eventPublisher.publishEvent(new ItineraryEventDetectedEvent(
                savedEvent.getId(), segment.getId(), itinerary.getId(), userEmail,
                EventSource.WEBHOOK.name()));
    }

    // ── Approval gate ─────────────────────────────────────────────────────────

    @Transactional
    public void approve(String userEmail, UUID proposalId) {
        ItineraryProposal proposal = loadOwnedProposal(userEmail, proposalId);
        if (proposal.getStatus() != ItineraryProposalStatus.PENDING_APPROVAL) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }

        List<ProposedChange> changes = changeRepository.findByProposalId(proposal.getId());
        boolean anyReplacement = false;
        for (ProposedChange change : changes) {
            applyChange(change);
            anyReplacement = anyReplacement || isReplacement(change.getChangeType());
        }

        proposal.setStatus(ItineraryProposalStatus.APPROVED);
        proposal.setResolvedAt(Instant.now());
        proposalRepository.save(proposal);

        // Open a support thread so the partner can be coordinated on the swap.
        if (anyReplacement) {
            openPartnerThread(userEmail, changes);
        }

        eventPublisher.publishEvent(new ItineraryApprovedEvent(
                proposal.getId(), proposal.getItineraryId(), userEmail));
    }

    @Transactional
    public void reject(String userEmail, UUID proposalId) {
        ItineraryProposal proposal = loadOwnedProposal(userEmail, proposalId);
        if (proposal.getStatus() != ItineraryProposalStatus.PENDING_APPROVAL) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }
        proposal.setStatus(ItineraryProposalStatus.REJECTED);
        proposal.setResolvedAt(Instant.now());
        proposalRepository.save(proposal);
    }

    private static boolean isReplacement(ProposedChangeType type) {
        return switch (type) {
            case REPLACE_FLIGHT, REPLACE_HOTEL, REPLACE_RESTAURANT -> true;
            case ADJUST_TIME, CANCEL_SEGMENT -> false;
        };
    }

    private void openPartnerThread(String userEmail, List<ProposedChange> changes) {
        String detail = changes.stream()
                .filter(c -> isReplacement(c.getChangeType()) && c.getReplacementLabel() != null)
                .map(ProposedChange::getReplacementLabel)
                .findFirst()
                .orElse("an updated booking");
        try {
            messagingService.start(userEmail,
                    "Itinerary change approved",
                    "I approved a re-plan for my trip: " + detail
                            + ". Please coordinate the updated reservation.");
        } catch (Exception ex) {
            log.warn("Could not open partner thread for {}: {}", userEmail, ex.getMessage());
        }
    }

    private void applyChange(ProposedChange change) {
        if (!isReplacement(change.getChangeType()) || change.getReplacementEntityId() == null) {
            return;
        }
        segmentRepository.findById(change.getSegmentId()).ifPresent(segment -> {
            segment.setEntityId(change.getReplacementEntityId());
            segment.setCurrentStatus(SegmentStatus.REBOOKED);
            if (change.getReplacementLabel() != null) {
                segment.setLabel(change.getReplacementLabel());
            }
            segmentRepository.save(segment);
        });
    }

    // ── Scheduled maintenance ──────────────────────────────────────────────────

    /** Expires pending proposals whose approval window has elapsed. Returns the count expired. */
    @Transactional
    public int expireStaleProposals() {
        List<ItineraryProposal> stale = proposalRepository
                .findByStatusAndExpiresAtBefore(ItineraryProposalStatus.PENDING_APPROVAL, Instant.now());
        Instant now = Instant.now();
        for (ItineraryProposal proposal : stale) {
            proposal.setStatus(ItineraryProposalStatus.EXPIRED);
            proposal.setResolvedAt(now);
        }
        proposalRepository.saveAll(stale);
        return stale.size();
    }

    /** Marks watched itineraries as checked. Placeholder for external availability polling. */
    @Transactional
    public int touchWatchedItineraries() {
        List<LiveItinerary> watched = itineraryRepository.findAllByWatchEnabledTrue();
        Instant now = Instant.now();
        for (LiveItinerary itinerary : watched) {
            itinerary.setLastCheckedAt(now);
        }
        itineraryRepository.saveAll(watched);
        return watched.size();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private LiveItinerary loadOwnedItinerary(String userEmail, UUID itineraryId) {
        LiveItinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ITINERARY_NOT_FOUND));
        bookingRepository.findByIdAndUserEmail(itinerary.getBookingId(), userEmail)
                .orElseThrow(() -> TravelAiException.forbidden(ErrorCode.ACCESS_DENIED));
        return itinerary;
    }

    private ItineraryProposal loadOwnedProposal(String userEmail, UUID proposalId) {
        ItineraryProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ITINERARY_PROPOSAL_NOT_FOUND));
        loadOwnedItinerary(userEmail, proposal.getItineraryId());
        return proposal;
    }

    private LiveItineraryResponse toResponse(LiveItinerary itinerary) {
        List<SegmentResponse> segments = segmentRepository.findByItineraryId(itinerary.getId())
                .stream().map(SegmentResponse::from).toList();
        List<ItineraryProposalResponse> pending = proposalRepository
                .findByItineraryIdAndStatus(itinerary.getId(), ItineraryProposalStatus.PENDING_APPROVAL)
                .stream().map(this::toProposalResponse).toList();
        return new LiveItineraryResponse(
                itinerary.getId(),
                itinerary.getBookingId(),
                itinerary.isWatchEnabled(),
                segments,
                pending);
    }

    private ItineraryProposalResponse toProposalResponse(ItineraryProposal proposal) {
        List<ProposedChangeResponse> changes = new ArrayList<>(
                changeRepository.findByProposalId(proposal.getId())
                        .stream().map(ProposedChangeResponse::from).toList());
        return ItineraryProposalResponse.from(proposal, changes);
    }
}
