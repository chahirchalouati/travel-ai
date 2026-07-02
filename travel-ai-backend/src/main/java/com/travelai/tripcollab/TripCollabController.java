package com.travelai.tripcollab;

import com.travelai.shared.domain.ApiResponse;
import com.travelai.tripcollab.dto.AcceptInviteRequest;
import com.travelai.tripcollab.dto.AcceptInviteResponse;
import com.travelai.tripcollab.dto.CastVoteRequest;
import com.travelai.tripcollab.dto.InviteMemberRequest;
import com.travelai.tripcollab.dto.SegmentVotesResponse;
import com.travelai.tripcollab.dto.TripMemberResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Trip collaboration endpoints. {@code tripId} is the booking id — the same id
 * the frontend uses for /trips/:id/live. All endpoints require authentication;
 * fine-grained authorization is enforced by {@link TripAccessService}.
 */
@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripCollabController {

    private final TripCollabService tripCollabService;
    private final SegmentVoteService segmentVoteService;

    // ── Members ─────────────────────────────────────────────────────────────

    @GetMapping("/{tripId}/members")
    public ApiResponse<List<TripMemberResponse>> listMembers(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId) {
        return ApiResponse.ok(tripCollabService.listMembers(tripId, user.getUsername()));
    }

    @PostMapping("/{tripId}/members/invite")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TripMemberResponse> invite(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId,
            @RequestBody @Valid InviteMemberRequest request) {
        return ApiResponse.ok(tripCollabService.invite(tripId, user.getUsername(), request));
    }

    @DeleteMapping("/{tripId}/members/{memberId}")
    public ApiResponse<Void> removeMember(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId,
            @PathVariable UUID memberId) {
        tripCollabService.removeMember(tripId, memberId, user.getUsername());
        return ApiResponse.ok(null);
    }

    /** Token-based acceptance — no tripId needed, the token is the credential. */
    @PostMapping("/members/accept")
    public ApiResponse<AcceptInviteResponse> accept(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody @Valid AcceptInviteRequest request) {
        return ApiResponse.ok(tripCollabService.accept(request.token(), user.getUsername()));
    }

    // ── Segment votes ───────────────────────────────────────────────────────

    @GetMapping("/{tripId}/segments/votes")
    public ApiResponse<List<SegmentVotesResponse>> listVotes(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId) {
        return ApiResponse.ok(segmentVoteService.votesForTrip(tripId, user.getUsername()));
    }

    @PutMapping("/{tripId}/segments/{segmentId}/vote")
    public ApiResponse<SegmentVotesResponse> vote(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId,
            @PathVariable UUID segmentId,
            @RequestBody @Valid CastVoteRequest request) {
        return ApiResponse.ok(
                segmentVoteService.vote(tripId, segmentId, user.getUsername(), request.vote()));
    }

    @DeleteMapping("/{tripId}/segments/{segmentId}/vote")
    public ApiResponse<SegmentVotesResponse> removeVote(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId,
            @PathVariable UUID segmentId) {
        return ApiResponse.ok(
                segmentVoteService.removeVote(tripId, segmentId, user.getUsername()));
    }
}
