package com.travelai.travel.events;

import java.util.UUID;

public record ProposalReadyEvent(
        UUID proposalId,
        UUID requestId,
        String userEmail
) {
}
