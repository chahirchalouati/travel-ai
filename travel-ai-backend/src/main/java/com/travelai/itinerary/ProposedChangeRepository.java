package com.travelai.itinerary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProposedChangeRepository extends JpaRepository<ProposedChange, UUID> {

    List<ProposedChange> findByProposalId(UUID proposalId);
}
