package com.travelai.tripcollab;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.notification.EmailService;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import com.travelai.tripcollab.dto.AcceptInviteResponse;
import com.travelai.tripcollab.dto.InviteMemberRequest;
import com.travelai.tripcollab.dto.TripMemberResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/** Companion management: invitations, acceptance, and removal. */
@Service
@RequiredArgsConstructor
@Slf4j
public class TripCollabService {

    private static final List<TripMemberStatus> BLOCKING_STATUSES =
            List.of(TripMemberStatus.PENDING, TripMemberStatus.ACCEPTED);

    private final TripMemberRepository memberRepository;
    private final TripAccessService tripAccessService;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Transactional(readOnly = true)
    public List<TripMemberResponse> listMembers(UUID tripId, String userEmail) {
        tripAccessService.requireView(tripId, userEmail);
        List<TripMember> members = memberRepository.findByTripIdOrderByCreatedAtAsc(tripId);
        Map<UUID, String> namesById = displayNames(members);
        return members.stream()
                .map(m -> TripMemberResponse.from(m, namesById.get(m.getUserId())))
                .toList();
    }

    @Transactional
    public TripMemberResponse invite(UUID tripId, String ownerEmail, InviteMemberRequest request) {
        tripAccessService.requireOwner(tripId, ownerEmail);
        String email = request.email().trim().toLowerCase();
        if (email.equalsIgnoreCase(ownerEmail)
                || memberRepository.existsByTripIdAndInvitedEmailIgnoreCaseAndStatusIn(
                        tripId, email, BLOCKING_STATUSES)) {
            throw TravelAiException.conflict(ErrorCode.TRIP_MEMBER_ALREADY_EXISTS);
        }

        TripMember member = new TripMember();
        member.setTripId(tripId);
        member.setInvitedEmail(email);
        member.setRole(request.role());
        member.setStatus(TripMemberStatus.PENDING);
        member.setInviteToken(UUID.randomUUID().toString());
        TripMember saved = memberRepository.save(member);

        sendInviteEmail(tripId, ownerEmail, saved);
        return TripMemberResponse.from(saved, null);
    }

    @Transactional
    public void removeMember(UUID tripId, UUID memberId, String ownerEmail) {
        tripAccessService.requireOwner(tripId, ownerEmail);
        TripMember member = memberRepository.findById(memberId)
                .filter(m -> m.getTripId().equals(tripId))
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.TRIP_MEMBER_NOT_FOUND));
        memberRepository.delete(member);
    }

    /**
     * Accepts an invite token, binding the currently authenticated user to the
     * membership (regardless of the address the invite was sent to — the token
     * itself is the credential). Returns the trip id to redirect to.
     */
    @Transactional
    public AcceptInviteResponse accept(String token, String userEmail) {
        TripMember member = memberRepository.findByInviteToken(token)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.TRIP_INVITE_INVALID));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));

        if (member.getStatus() == TripMemberStatus.ACCEPTED
                && user.getId().equals(member.getUserId())) {
            return new AcceptInviteResponse(member.getTripId()); // idempotent re-accept
        }
        if (member.getStatus() != TripMemberStatus.PENDING) {
            throw TravelAiException.badRequest(ErrorCode.TRIP_INVITE_INVALID);
        }

        member.setUserId(user.getId());
        member.setStatus(TripMemberStatus.ACCEPTED);
        member.setRespondedAt(Instant.now());
        memberRepository.save(member);
        return new AcceptInviteResponse(member.getTripId());
    }

    private void sendInviteEmail(UUID tripId, String ownerEmail, TripMember member) {
        Booking booking = bookingRepository.findById(tripId).orElse(null);
        String destination = booking != null && booking.getDestination() != null
                ? booking.getDestination() : "un voyage";
        UUID ownerId = booking != null && booking.getUser() != null ? booking.getUser().getId() : null;
        String link = frontendUrl + "/trips/invite?token=" + member.getInviteToken();
        String subject = "Invitation de voyage — " + destination;
        String body = """
                <div style="font-family:sans-serif;max-width:520px">
                  <h2 style="margin:0 0 8px">Vous êtes invité(e) à rejoindre un voyage</h2>
                  <p>%s vous invite à rejoindre son voyage <strong>%s</strong> en tant que
                     <strong>%s</strong>.</p>
                  <p style="margin:24px 0">
                    <a href="%s" style="background:#2563eb;color:#fff;padding:12px 20px;
                       border-radius:8px;text-decoration:none;font-weight:700">
                       Accepter l'invitation</a>
                  </p>
                  <p style="color:#6b7280;font-size:13px">Connectez-vous (ou créez un compte)
                     avec cette adresse, puis ouvrez le lien : <a href="%s">%s</a></p>
                </div>
                """.formatted(ownerEmail, destination,
                member.getRole() == TripRole.EDITOR ? "éditeur" : "spectateur", link, link, link);
        try {
            emailService.sendHtml(ownerId, member.getInvitedEmail(), subject, body);
        } catch (RuntimeException ex) {
            log.warn("Could not send trip invite email to {}: {}", member.getInvitedEmail(), ex.getMessage());
        }
    }

    private Map<UUID, String> displayNames(List<TripMember> members) {
        List<UUID> userIds = members.stream()
                .map(TripMember::getUserId)
                .filter(Objects::nonNull)
                .toList();
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId,
                        u -> (u.getFirstName() + " " + u.getLastName()).trim(),
                        (a, b) -> a));
    }
}
