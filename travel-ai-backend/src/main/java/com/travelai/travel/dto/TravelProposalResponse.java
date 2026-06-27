package com.travelai.travel.dto;

import com.travelai.travel.ProposalStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TravelProposalResponse(
        UUID id,
        UUID requestId,
        String destination,
        ProposalStatus status,
        UUID hotelId,
        UUID restaurantId,
        UUID flightId,
        BigDecimal totalCost,
        BigDecimal hotelCost,
        BigDecimal restaurantCost,
        BigDecimal flightCost,
        String aiMotivation,
        Integer rankScore,
        LocalDateTime expiresAt
) {
}
