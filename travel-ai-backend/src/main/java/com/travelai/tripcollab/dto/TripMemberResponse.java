package com.travelai.tripcollab.dto;

import com.travelai.tripcollab.TripMember;

import java.time.Instant;
import java.util.UUID;

public record TripMemberResponse(
        UUID id,
        String invitedEmail,
        String role,
        String status,
        String displayName,
        Instant createdAt,
        Instant respondedAt
) {
    public static TripMemberResponse from(TripMember member, String displayName) {
        return new TripMemberResponse(
                member.getId(),
                member.getInvitedEmail(),
                member.getRole().name(),
                member.getStatus().name(),
                displayName,
                member.getCreatedAt(),
                member.getRespondedAt()
        );
    }
}
