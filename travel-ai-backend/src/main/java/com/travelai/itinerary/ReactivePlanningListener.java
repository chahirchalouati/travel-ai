package com.travelai.itinerary;

import com.travelai.ai.planning.FlightAgent;
import com.travelai.ai.planning.HotelAgent;
import com.travelai.ai.planning.RestaurantAgent;
import com.travelai.ai.planning.dto.AgentContext;
import com.travelai.ai.planning.dto.FlightOption;
import com.travelai.ai.planning.dto.HotelOption;
import com.travelai.ai.planning.dto.RestaurantOption;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.itinerary.events.ItineraryEventDetectedEvent;
import com.travelai.itinerary.events.ItineraryProposalReadyEvent;
import com.travelai.shared.domain.SpendingPriority;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Listens for a detected disruption and asks the existing AI agents for an alternative
 * to the affected segment, persisting the result as a {@link ItineraryProposal} that
 * waits for user approval. Reuses the same agent stack as initial planning.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReactivePlanningListener {

    private static final int PROPOSAL_TTL_HOURS = 48;

    private final ItinerarySegmentRepository segmentRepository;
    private final ItineraryProposalRepository proposalRepository;
    private final ProposedChangeRepository changeRepository;
    private final LiveItineraryRepository itineraryRepository;
    private final BookingRepository bookingRepository;
    private final FlightAgent flightAgent;
    private final HotelAgent hotelAgent;
    private final RestaurantAgent restaurantAgent;
    private final ChatClient chatClient;
    private final ApplicationEventPublisher eventPublisher;

    @ApplicationModuleListener
    @Async
    public void onEventDetected(ItineraryEventDetectedEvent event) {
        try {
            replan(event);
        } catch (Exception ex) {
            log.error("Re-plan failed for itinerary {} segment {}: {}",
                    event.itineraryId(), event.segmentId(), ex.getMessage(), ex);
        }
    }

    private void replan(ItineraryEventDetectedEvent event) {
        ItinerarySegment segment = segmentRepository.findById(event.segmentId()).orElse(null);
        LiveItinerary itinerary = itineraryRepository.findById(event.itineraryId()).orElse(null);
        if (segment == null || itinerary == null) {
            return;
        }
        Booking booking = bookingRepository.findById(itinerary.getBookingId()).orElse(null);
        if (booking == null) {
            return;
        }

        AgentContext ctx = buildContext(booking, segment.getSegmentType());
        Replacement replacement = findReplacement(segment.getSegmentType(), ctx, booking);
        if (replacement == null) {
            log.info("No alternative found for {} segment {}", segment.getSegmentType(), segment.getId());
            return;
        }

        ItineraryProposal proposal = new ItineraryProposal();
        proposal.setItineraryId(itinerary.getId());
        proposal.setTriggeringEventId(event.eventId());
        proposal.setStatus(ItineraryProposalStatus.PENDING_APPROVAL);
        proposal.setExpiresAt(Instant.now().plus(PROPOSAL_TTL_HOURS, ChronoUnit.HOURS));
        proposal.setAiSummary(generateSummary(segment, replacement));
        ItineraryProposal savedProposal = proposalRepository.save(proposal);

        ProposedChange change = new ProposedChange();
        change.setProposalId(savedProposal.getId());
        change.setSegmentId(segment.getId());
        change.setChangeType(replacement.changeType());
        change.setReplacementEntityId(replacement.entityId());
        change.setReplacementLabel(replacement.label());
        change.setCostDelta(replacement.costDelta());
        change.setAiRationale(replacement.rationale());
        changeRepository.save(change);

        UUID userId = booking.getUser() != null ? booking.getUser().getId() : null;
        eventPublisher.publishEvent(new ItineraryProposalReadyEvent(
                savedProposal.getId(), itinerary.getId(), userId, event.userEmail(),
                savedProposal.getAiSummary()));

        log.info("Re-plan proposal {} created for itinerary {}", savedProposal.getId(), itinerary.getId());
    }

    private AgentContext buildContext(Booking booking, SegmentType disrupted) {
        int adults = booking.getTravelers() == null || booking.getTravelers().isEmpty()
                ? 1 : booking.getTravelers().size();
        BigDecimal zero = BigDecimal.ZERO;
        BigDecimal flightBudget = disrupted == SegmentType.FLIGHT ? nonNull(booking.getFlightAmount()) : zero;
        BigDecimal hotelBudget = disrupted == SegmentType.HOTEL ? nonNull(booking.getHotelAmount()) : zero;
        BigDecimal restaurantBudget = disrupted == SegmentType.RESTAURANT ? nonNull(booking.getRestaurantAmount()) : zero;

        return new AgentContext(
                UUID.randomUUID(),
                booking.getDestination(),
                booking.getCheckIn(),
                booking.getCheckOut(),
                adults,
                0,
                nonNull(booking.getTotalAmount()),
                hotelBudget,
                restaurantBudget,
                flightBudget,
                SpendingPriority.BALANCED,
                List.of());
    }

    private Replacement findReplacement(SegmentType type, AgentContext ctx, Booking booking) {
        return switch (type) {
            case FLIGHT -> {
                List<FlightOption> options = flightAgent.findOptions(ctx);
                if (options.isEmpty()) {
                    yield null;
                }
                FlightOption f = options.get(0);
                yield new Replacement(
                        ProposedChangeType.REPLACE_FLIGHT,
                        f.flightId(),
                        f.airline() + " " + f.origin() + "→" + f.destination(),
                        delta(f.price(), booking.getFlightAmount()),
                        "Alternative flight with available seats on a matching route.");
            }
            case HOTEL -> {
                List<HotelOption> options = hotelAgent.findOptions(ctx);
                if (options.isEmpty()) {
                    yield null;
                }
                HotelOption h = options.get(0);
                yield new Replacement(
                        ProposedChangeType.REPLACE_HOTEL,
                        h.hotelId(),
                        h.name() + " · " + h.city(),
                        delta(h.totalCost(), booking.getHotelAmount()),
                        "Comparable hotel with availability for your dates.");
            }
            case RESTAURANT -> {
                List<RestaurantOption> options = restaurantAgent.findOptions(ctx);
                if (options.isEmpty()) {
                    yield null;
                }
                RestaurantOption r = options.get(0);
                yield new Replacement(
                        ProposedChangeType.REPLACE_RESTAURANT,
                        r.restaurantId(),
                        r.name() + " · " + r.cuisine(),
                        delta(r.estimatedCostPerPerson(), booking.getRestaurantAmount()),
                        "Similar restaurant with an open table near your stay.");
            }
        };
    }

    private String generateSummary(ItinerarySegment segment, Replacement replacement) {
        String prompt = """
                A traveler's %s was disrupted. We found a replacement: %s.
                Write one friendly, concise sentence (max 30 words) telling the traveler
                what happened and what we propose, without making up details.
                """.formatted(segment.getSegmentType().name().toLowerCase(), replacement.label());
        try {
            String content = chatClient.prompt(prompt).call().content();
            if (content != null && !content.isBlank()) {
                return content.trim();
            }
        } catch (Exception ex) {
            log.warn("AI summary generation failed, using fallback: {}", ex.getMessage());
        }
        return "Your " + segment.getSegmentType().name().toLowerCase()
                + " was disrupted — we found an alternative: " + replacement.label() + ".";
    }

    private static BigDecimal delta(BigDecimal newPrice, BigDecimal oldAmount) {
        if (newPrice == null) {
            return null;
        }
        return newPrice.subtract(nonNull(oldAmount));
    }

    private static BigDecimal nonNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    /** Internal carrier for a chosen replacement option. */
    private record Replacement(
            ProposedChangeType changeType,
            UUID entityId,
            String label,
            BigDecimal costDelta,
            String rationale) {}
}
