package com.travelai.tripcollab.dto;

import java.util.List;
import java.util.UUID;

/**
 * Vote state of one itinerary segment: aggregate score (+1 per UP, -1 per DOWN),
 * the caller's own vote (null when they have not voted), and per-member votes.
 */
public record SegmentVotesResponse(
        UUID segmentId,
        int score,
        String myVote,
        List<SegmentVoteView> votes
) {
}
