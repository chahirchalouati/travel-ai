package com.travelai.tripcollab;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class TripAccessServiceTest {

    private static final String OWNER_EMAIL = "owner@example.com";
    private static final String COMPANION_EMAIL = "friend@example.com";
    private static final String STRANGER_EMAIL = "stranger@example.com";

    @Mock private BookingRepository bookingRepository;
    @Mock private TripMemberRepository memberRepository;
    @Mock private UserRepository userRepository;

    private TripAccessService service;

    private final UUID tripId = UUID.randomUUID();
    private final UUID companionUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new TripAccessService(bookingRepository, memberRepository, userRepository);

        User owner = User.builder().email(OWNER_EMAIL).build();
        Booking booking = new Booking();
        booking.setUser(owner);
        lenient().when(bookingRepository.findById(tripId)).thenReturn(Optional.of(booking));

        User companion = User.builder().email(COMPANION_EMAIL).build();
        ReflectionTestUtils.setField(companion, "id", companionUserId);
        lenient().when(userRepository.findByEmail(COMPANION_EMAIL)).thenReturn(Optional.of(companion));
        lenient().when(userRepository.findByEmail(STRANGER_EMAIL)).thenReturn(Optional.empty());
    }

    private void memberWithRole(TripRole role, TripMemberStatus status) {
        TripMember member = new TripMember();
        member.setTripId(tripId);
        member.setUserId(companionUserId);
        member.setRole(role);
        member.setStatus(status);
        lenient().when(memberRepository.findByTripIdAndUserIdAndStatus(
                        tripId, companionUserId, TripMemberStatus.ACCEPTED))
                .thenReturn(status == TripMemberStatus.ACCEPTED ? Optional.of(member) : Optional.empty());
    }

    // ── Access matrix ────────────────────────────────────────────────────────

    @Test
    @DisplayName("booking owner resolves to OWNER: may view, edit and administrate")
    void owner_hasFullAccess() {
        assertThat(service.levelFor(tripId, OWNER_EMAIL)).isEqualTo(TripAccessLevel.OWNER);
        assertThatCode(() -> service.requireView(tripId, OWNER_EMAIL)).doesNotThrowAnyException();
        assertThatCode(() -> service.requireEdit(tripId, OWNER_EMAIL)).doesNotThrowAnyException();
        assertThatCode(() -> service.requireOwner(tripId, OWNER_EMAIL)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("accepted EDITOR may view and edit but is not owner")
    void editor_canViewAndEdit_notOwner() {
        memberWithRole(TripRole.EDITOR, TripMemberStatus.ACCEPTED);

        assertThat(service.levelFor(tripId, COMPANION_EMAIL)).isEqualTo(TripAccessLevel.EDITOR);
        assertThatCode(() -> service.requireView(tripId, COMPANION_EMAIL)).doesNotThrowAnyException();
        assertThatCode(() -> service.requireEdit(tripId, COMPANION_EMAIL)).doesNotThrowAnyException();
        assertThatThrownBy(() -> service.requireOwner(tripId, COMPANION_EMAIL))
                .isInstanceOf(TravelAiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("accepted VIEWER may view but not edit nor administrate")
    void viewer_canOnlyView() {
        memberWithRole(TripRole.VIEWER, TripMemberStatus.ACCEPTED);

        assertThat(service.levelFor(tripId, COMPANION_EMAIL)).isEqualTo(TripAccessLevel.VIEWER);
        assertThatCode(() -> service.requireView(tripId, COMPANION_EMAIL)).doesNotThrowAnyException();
        assertThatThrownBy(() -> service.requireEdit(tripId, COMPANION_EMAIL))
                .isInstanceOf(TravelAiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ACCESS_DENIED);
        assertThatThrownBy(() -> service.requireOwner(tripId, COMPANION_EMAIL))
                .isInstanceOf(TravelAiException.class);
    }

    @Test
    @DisplayName("PENDING invitee has no access until acceptance")
    void pendingMember_hasNoAccess() {
        memberWithRole(TripRole.EDITOR, TripMemberStatus.PENDING);

        assertThat(service.levelFor(tripId, COMPANION_EMAIL)).isEqualTo(TripAccessLevel.NONE);
        assertThatThrownBy(() -> service.requireView(tripId, COMPANION_EMAIL))
                .isInstanceOf(TravelAiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("non-member resolves to NONE and is denied everywhere")
    void stranger_isDenied() {
        assertThat(service.levelFor(tripId, STRANGER_EMAIL)).isEqualTo(TripAccessLevel.NONE);
        assertThatThrownBy(() -> service.requireView(tripId, STRANGER_EMAIL))
                .isInstanceOf(TravelAiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.ACCESS_DENIED);
        assertThatThrownBy(() -> service.requireEdit(tripId, STRANGER_EMAIL))
                .isInstanceOf(TravelAiException.class);
        assertThatThrownBy(() -> service.requireOwner(tripId, STRANGER_EMAIL))
                .isInstanceOf(TravelAiException.class);
    }

    @Test
    @DisplayName("unknown trip id yields BOOKING_NOT_FOUND")
    void unknownTrip_notFound() {
        UUID missing = UUID.randomUUID();
        assertThatThrownBy(() -> service.levelFor(missing, OWNER_EMAIL))
                .isInstanceOf(TravelAiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.BOOKING_NOT_FOUND);
    }

    @Test
    @DisplayName("owner email comparison is case-insensitive")
    void ownerEmail_caseInsensitive() {
        assertThat(service.levelFor(tripId, "OWNER@Example.COM")).isEqualTo(TripAccessLevel.OWNER);
    }
}
