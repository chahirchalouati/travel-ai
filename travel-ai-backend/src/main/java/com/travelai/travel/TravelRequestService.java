package com.travelai.travel;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import com.travelai.travel.dto.CreateTravelRequestRequest;
import com.travelai.travel.dto.TravelProposalResponse;
import com.travelai.travel.dto.TravelRequestResponse;
import com.travelai.travel.events.ProposalReadyEvent;
import com.travelai.travel.events.TravelRequestCreatedEvent;
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
public class TravelRequestService {

    private final TravelRequestRepository requestRepository;
    private final TravelProposalRepository proposalRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public TravelRequestResponse createRequest(String userEmail, CreateTravelRequestRequest req) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));

        TravelRequest entity = new TravelRequest();
        entity.setUser(user);
        entity.setDestination(req.destination());
        entity.setDepartureDate(req.departureDate());
        entity.setReturnDate(req.returnDate());
        entity.setDateMode(req.dateMode());
        entity.setAdultsCount(req.adultsCount());
        entity.setChildrenCount(req.childrenCount() != null ? req.childrenCount() : 0);
        entity.setBudget(req.budget());
        entity.setSpendingPriority(req.spendingPriority());
        entity.setConstraints(req.constraints() != null ? req.constraints() : List.of());

        TravelRequest saved = requestRepository.save(entity);
        eventPublisher.publishEvent(new TravelRequestCreatedEvent(
                saved.getId(),
                userEmail,
                saved.getBudget(),
                saved.getSpendingPriority(),
                saved.getDestination()
        ));

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<TravelRequestResponse> getMyRequests(String email, Pageable pageable) {
        return requestRepository.findByUserEmailAndActiveTrue(email, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<TravelProposalResponse> getProposals(String email, UUID requestId) {
        requestRepository.findByIdAndUserEmail(requestId, email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.REQUEST_NOT_FOUND));
        return proposalRepository.findByRequestIdOrderByRankScoreDesc(requestId)
                .stream().map(this::toProposalResponse).toList();
    }

    public TravelProposalResponse selectProposal(String email, UUID requestId, UUID proposalId) {
        requestRepository.findByIdAndUserEmail(requestId, email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.REQUEST_NOT_FOUND));
        TravelProposal proposal = proposalRepository.findByIdAndRequestId(proposalId, requestId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PROPOSAL_NOT_FOUND));

        proposal.setSelected(true);
        proposal.setStatus(ProposalStatus.BOOKED);
        eventPublisher.publishEvent(new ProposalReadyEvent(proposalId, requestId, email));

        return toProposalResponse(proposalRepository.save(proposal));
    }

    private TravelRequestResponse toResponse(TravelRequest r) {
        return new TravelRequestResponse(
                r.getId(),
                r.getDestination(),
                r.getDepartureDate(),
                r.getReturnDate(),
                r.getDateMode(),
                r.getAdultsCount(),
                r.getChildrenCount(),
                r.getBudget(),
                r.getSpendingPriority(),
                r.getConstraints(),
                r.getCreatedAt()
        );
    }

    private TravelProposalResponse toProposalResponse(TravelProposal p) {
        return new TravelProposalResponse(
                p.getId(),
                p.getRequest().getId(),
                p.getDestination(),
                p.getStatus(),
                p.getHotelId(),
                p.getRestaurantId(),
                p.getFlightId(),
                p.getTotalCost(),
                p.getHotelCost(),
                p.getRestaurantCost(),
                p.getFlightCost(),
                p.getAiMotivation(),
                p.getRankScore(),
                p.getExpiresAt()
        );
    }
}
