package com.travelai.tripcollab;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.itinerary.ItinerarySegment;
import com.travelai.itinerary.ItinerarySegmentRepository;
import com.travelai.itinerary.LiveItinerary;
import com.travelai.itinerary.LiveItineraryRepository;
import com.travelai.tripcollab.dto.SegmentVotesResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SegmentVoteServiceTest {

    private static final String EMAIL = "voter@example.com";

    @Mock private SegmentVoteRepository voteRepository;
    @Mock private TripAccessService tripAccessService;
    @Mock private ItinerarySegmentRepository segmentRepository;
    @Mock private LiveItineraryRepository itineraryRepository;
    @Mock private UserRepository userRepository;

    private SegmentVoteService service;

    private final UUID tripId = UUID.randomUUID();
    private final UUID itineraryId = UUID.randomUUID();
    private final UUID segmentId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new SegmentVoteService(
                voteRepository, tripAccessService, segmentRepository, itineraryRepository, userRepository);

        LiveItinerary itinerary = new LiveItinerary();
        itinerary.setBookingId(tripId);
        ReflectionTestUtils.setField(itinerary, "id", itineraryId);

        ItinerarySegment segment = new ItinerarySegment();
        segment.setItineraryId(itineraryId);
        ReflectionTestUtils.setField(segment, "id", segmentId);

        lenient().when(segmentRepository.findById(segmentId)).thenReturn(Optional.of(segment));
        lenient().when(itineraryRepository.findById(itineraryId)).thenReturn(Optional.of(itinerary));

        User user = User.builder().email(EMAIL).firstName("Vera").lastName("Voter").build();
        ReflectionTestUtils.setField(user, "id", userId);
        lenient().when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        lenient().when(userRepository.findAllById(any())).thenReturn(List.of(user));
    }

    private SegmentVote existingVote(VoteValue value) {
        SegmentVote v = new SegmentVote();
        v.setSegmentId(segmentId);
        v.setUserId(userId);
        v.setVote(value);
        return v;
    }

    @Test
    @DisplayName("first vote is created and scores +1 for UP")
    void firstUpVote_created() {
        when(voteRepository.findBySegmentIdAndUserId(segmentId, userId)).thenReturn(Optional.empty());
        when(voteRepository.findBySegmentId(segmentId)).thenReturn(List.of(existingVote(VoteValue.UP)));

        SegmentVotesResponse res = service.vote(tripId, segmentId, EMAIL, VoteValue.UP);

        verify(voteRepository).save(any(SegmentVote.class));
        assertThat(res.score()).isEqualTo(1);
        assertThat(res.myVote()).isEqualTo("UP");
    }

    @Test
    @DisplayName("re-casting the same vote toggles it off (deletes) and score returns to 0")
    void sameVote_togglesOff() {
        SegmentVote existing = existingVote(VoteValue.UP);
        when(voteRepository.findBySegmentIdAndUserId(segmentId, userId)).thenReturn(Optional.of(existing));
        when(voteRepository.findBySegmentId(segmentId)).thenReturn(List.of());

        SegmentVotesResponse res = service.vote(tripId, segmentId, EMAIL, VoteValue.UP);

        verify(voteRepository).delete(existing);
        verify(voteRepository, never()).save(any());
        assertThat(res.score()).isZero();
        assertThat(res.myVote()).isNull();
    }

    @Test
    @DisplayName("casting the opposite vote flips the existing record, not delete")
    void oppositeVote_flips() {
        SegmentVote existing = existingVote(VoteValue.UP);
        when(voteRepository.findBySegmentIdAndUserId(segmentId, userId)).thenReturn(Optional.of(existing));
        when(voteRepository.findBySegmentId(segmentId)).thenReturn(List.of(existingVote(VoteValue.DOWN)));

        SegmentVotesResponse res = service.vote(tripId, segmentId, EMAIL, VoteValue.DOWN);

        assertThat(existing.getVote()).isEqualTo(VoteValue.DOWN);
        verify(voteRepository).save(existing);
        verify(voteRepository, never()).delete(any());
        assertThat(res.score()).isEqualTo(-1);
        assertThat(res.myVote()).isEqualTo("DOWN");
    }

    @Test
    @DisplayName("removeVote deletes the caller's vote when present")
    void removeVote_deletes() {
        SegmentVote existing = existingVote(VoteValue.DOWN);
        when(voteRepository.findBySegmentIdAndUserId(segmentId, userId)).thenReturn(Optional.of(existing));
        when(voteRepository.findBySegmentId(segmentId)).thenReturn(List.of());

        service.removeVote(tripId, segmentId, EMAIL);

        verify(voteRepository).delete(existing);
    }

    @Test
    @DisplayName("voting requires view access — the access check is invoked")
    void vote_checksViewAccess() {
        when(voteRepository.findBySegmentIdAndUserId(segmentId, userId)).thenReturn(Optional.empty());
        when(voteRepository.findBySegmentId(segmentId)).thenReturn(List.of(existingVote(VoteValue.UP)));

        service.vote(tripId, segmentId, EMAIL, VoteValue.UP);

        verify(tripAccessService).requireView(tripId, EMAIL);
    }
}
