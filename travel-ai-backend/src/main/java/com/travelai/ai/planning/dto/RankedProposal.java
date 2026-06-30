package com.travelai.ai.planning.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RankedProposal(
        UUID hotelId,
        UUID restaurantId,
        UUID flightId,
        BigDecimal totalCost,
        BigDecimal hotelCost,
        BigDecimal restaurantCost,
        BigDecimal flightCost,
        int rankScore,
        String aiMotivation,
        String destination
) {
}
