package com.travelai.ai.planning;

import com.travelai.ai.planning.dto.AgentContext;
import com.travelai.ai.planning.dto.RankedProposal;
import com.travelai.travel.ProposalStatus;
import com.travelai.travel.TravelProposal;
import com.travelai.travel.TravelProposalRepository;
import com.travelai.travel.TravelRequest;
import com.travelai.travel.TravelRequestRepository;
import com.travelai.travel.events.TravelRequestCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PlanningOrchestrator {

    private final OrchestratorAgent orchestratorAgent;
    private final AiBudgetSplitter budgetSplitter;
    private final AiRateLimiter rateLimiter;
    private final TravelRequestRepository requestRepository;
    private final TravelProposalRepository proposalRepository;
    private final ApplicationEventPublisher eventPublisher;

    @ApplicationModuleListener
    @Async
    public void onTravelRequestCreated(TravelRequestCreatedEvent event) {
        log.info("Planning started for request {}", event.requestId());

        if (!rateLimiter.tryAcquire(event.userEmail())) {
            log.warn("Rate limit exceeded for user {}", event.userEmail());
            return;
        }

        try {
            TravelRequest request = requestRepository.findById(event.requestId()).orElseThrow();
            java.math.BigDecimal[] budgets = budgetSplitter.split(event.budget(), event.spendingPriority());

            AgentContext ctx = new AgentContext(
                    request.getId(),
                    request.getDestination(),
                    request.getDepartureDate(),
                    request.getReturnDate(),
                    request.getAdultsCount(),
                    request.getChildrenCount(),
                    request.getBudget(),
                    budgets[0],
                    budgets[1],
                    budgets[2],
                    request.getSpendingPriority(),
                    request.getConstraints()
            );

            List<RankedProposal> ranked = orchestratorAgent.orchestrate(ctx);

            for (RankedProposal rp : ranked) {
                TravelProposal proposal = new TravelProposal();
                proposal.setRequest(request);
                proposal.setStatus(ProposalStatus.READY);
                proposal.setDestination(request.getDestination());
                proposal.setHotelId(rp.hotelId());
                proposal.setRestaurantId(rp.restaurantId());
                proposal.setFlightId(rp.flightId());
                proposal.setTotalCost(rp.totalCost());
                proposal.setHotelCost(rp.hotelCost());
                proposal.setRestaurantCost(rp.restaurantCost());
                proposal.setFlightCost(rp.flightCost());
                proposal.setRankScore(rp.rankScore());
                proposal.setAiMotivation(rp.aiMotivation());
                proposal.setExpiresAt(LocalDateTime.now().plusHours(48));
                proposalRepository.save(proposal);
            }

            log.info("Generated {} proposals for request {}", ranked.size(), event.requestId());
        } catch (Exception e) {
            log.error("Planning failed for request {}", event.requestId(), e);
        }
    }
}
