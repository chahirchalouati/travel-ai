package com.travelai.tripcollab;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.itinerary.ItinerarySegment;
import com.travelai.itinerary.ItinerarySegmentRepository;
import com.travelai.itinerary.LiveItinerary;
import com.travelai.itinerary.LiveItineraryRepository;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import com.travelai.tripcollab.dto.SegmentVoteView;
import com.travelai.tripcollab.dto.SegmentVotesResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * UP/DOWN voting on itinerary segments. Everyone with view access to the trip
 * (owner and accepted companions, including viewers) may vote — voting is the
 * core collaboration primitive. Casting the same vote twice toggles it off.
 */
@Service
@RequiredArgsConstructor
public class SegmentVoteService {

    private final SegmentVoteRepository voteRepository;
    private final TripAccessService tripAccessService;
    private final ItinerarySegmentRepository segmentRepository;
    private final LiveItineraryRepository itineraryRepository;
    private final UserRepository userRepository;

    /** Casts, changes, or (when re-casting the same value) toggles off a vote. */
    @Transactional
    public SegmentVotesResponse vote(UUID tripId, UUID segmentId, String userEmail, VoteValue value) {
        tripAccessService.requireView(tripId, userEmail);
        requireSegmentInTrip(tripId, segmentId);
        User user = requireUser(userEmail);

        voteRepository.findBySegmentIdAndUserId(segmentId, user.getId())
                .ifPresentOrElse(existing -> {
                    if (existing.getVote() == value) {
                        voteRepository.delete(existing); // toggle off
                    } else {
                        existing.setVote(value);
                        voteRepository.save(existing);
                    }
                }, () -> {
                    SegmentVote vote = new SegmentVote();
                    vote.setSegmentId(segmentId);
                    vote.setUserId(user.getId());
                    vote.setVote(value);
                    voteRepository.save(vote);
                });
        return summarize(segmentId, voteRepository.findBySegmentId(segmentId), user.getId());
    }

    /** Removes the caller's vote on the segment, if any. */
    @Transactional
    public SegmentVotesResponse removeVote(UUID tripId, UUID segmentId, String userEmail) {
        tripAccessService.requireView(tripId, userEmail);
        requireSegmentInTrip(tripId, segmentId);
        User user = requireUser(userEmail);
        voteRepository.findBySegmentIdAndUserId(segmentId, user.getId())
                .ifPresent(voteRepository::delete);
        return summarize(segmentId, voteRepository.findBySegmentId(segmentId), user.getId());
    }

    /** Vote state for every segment of the trip's live itinerary. */
    @Transactional(readOnly = true)
    public List<SegmentVotesResponse> votesForTrip(UUID tripId, String userEmail) {
        tripAccessService.requireView(tripId, userEmail);
        LiveItinerary itinerary = itineraryRepository.findByBookingId(tripId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ITINERARY_NOT_FOUND));
        List<ItinerarySegment> segments = segmentRepository.findByItineraryId(itinerary.getId());
        UUID myUserId = userRepository.findByEmail(userEmail).map(User::getId).orElse(null);

        List<UUID> segmentIds = segments.stream().map(ItinerarySegment::getId).toList();
        Map<UUID, List<SegmentVote>> votesBySegment = segmentIds.isEmpty()
                ? Map.of()
                : voteRepository.findBySegmentIdIn(segmentIds).stream()
                        .collect(Collectors.groupingBy(SegmentVote::getSegmentId));

        return segments.stream()
                .map(segment -> summarize(segment.getId(),
                        votesBySegment.getOrDefault(segment.getId(), List.of()), myUserId))
                .toList();
    }

    private SegmentVotesResponse summarize(UUID segmentId, List<SegmentVote> votes, UUID myUserId) {
        Map<UUID, String> names = voterNames(votes);
        int score = votes.stream().mapToInt(v -> v.getVote() == VoteValue.UP ? 1 : -1).sum();
        String myVote = votes.stream()
                .filter(v -> v.getUserId().equals(myUserId))
                .map(v -> v.getVote().name())
                .findFirst()
                .orElse(null);
        List<SegmentVoteView> views = votes.stream()
                .map(v -> new SegmentVoteView(v.getUserId(),
                        names.getOrDefault(v.getUserId(), "?"), v.getVote().name()))
                .toList();
        return new SegmentVotesResponse(segmentId, score, myVote, views);
    }

    private Map<UUID, String> voterNames(List<SegmentVote> votes) {
        List<UUID> ids = votes.stream().map(SegmentVote::getUserId).filter(Objects::nonNull).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId,
                        u -> (u.getFirstName() + " " + u.getLastName()).trim(),
                        (a, b) -> a));
    }

    private void requireSegmentInTrip(UUID tripId, UUID segmentId) {
        ItinerarySegment segment = segmentRepository.findById(segmentId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ITINERARY_SEGMENT_NOT_FOUND));
        LiveItinerary itinerary = itineraryRepository.findById(segment.getItineraryId())
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ITINERARY_NOT_FOUND));
        if (!itinerary.getBookingId().equals(tripId)) {
            throw TravelAiException.notFound(ErrorCode.ITINERARY_SEGMENT_NOT_FOUND);
        }
    }

    private User requireUser(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
    }
}
