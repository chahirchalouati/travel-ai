package com.travelai.itinerary.dto;

import com.travelai.itinerary.ProposedChange;

import java.math.BigDecimal;
import java.util.UUID;

public record ProposedChangeResponse(
        UUID id,
        UUID segmentId,
        String changeType,
        UUID replacementEntityId,
        String replacementLabel,
        BigDecimal costDelta,
        String aiRationale
) {
    public static ProposedChangeResponse from(ProposedChange c) {
        return new ProposedChangeResponse(
                c.getId(),
                c.getSegmentId(),
                c.getChangeType().name(),
                c.getReplacementEntityId(),
                c.getReplacementLabel(),
                c.getCostDelta(),
                c.getAiRationale()
        );
    }
}
