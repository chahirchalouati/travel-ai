package com.travelai.tripcollab;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripMemberRepository extends JpaRepository<TripMember, UUID> {

    List<TripMember> findByTripIdOrderByCreatedAtAsc(UUID tripId);

    Optional<TripMember> findByInviteToken(String inviteToken);

    Optional<TripMember> findByTripIdAndUserIdAndStatus(UUID tripId, UUID userId, TripMemberStatus status);

    boolean existsByTripIdAndInvitedEmailIgnoreCaseAndStatusIn(
            UUID tripId, String invitedEmail, List<TripMemberStatus> statuses);
}
