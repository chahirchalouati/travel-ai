package com.travelai.travel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TravelProposalRepository extends JpaRepository<TravelProposal, UUID> {

    List<TravelProposal> findByRequestIdOrderByRankScoreDesc(UUID requestId);

    List<TravelProposal> findByRequestIdAndStatus(UUID requestId, ProposalStatus status);

    Optional<TravelProposal> findByIdAndRequestId(UUID id, UUID requestId);
}
