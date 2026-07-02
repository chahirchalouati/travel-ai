package com.travelai.tripcollab;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SegmentVoteRepository extends JpaRepository<SegmentVote, UUID> {

    List<SegmentVote> findBySegmentId(UUID segmentId);

    List<SegmentVote> findBySegmentIdIn(Collection<UUID> segmentIds);

    Optional<SegmentVote> findBySegmentIdAndUserId(UUID segmentId, UUID userId);
}
