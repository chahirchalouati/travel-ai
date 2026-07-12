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
        String avatarUrl,
        Instant createdAt,
        Instant respondedAt
) {
    public static TripMemberResponse from(TripMember member, String displayName) {
        return from(member, displayName, null);
    }

    public static TripMemberResponse from(TripMember member, String displayName, String avatarUrl) {
        return new TripMemberResponse(
                member.getId(),
                member.getInvitedEmail(),
                member.getRole().name(),
                member.getStatus().name(),
                displayName,
                avatarUrl,
                member.getCreatedAt(),
                member.getRespondedAt()
        );
    }
}
