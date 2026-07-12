package com.travelai.user;

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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * {@link UserService#getBookingIds(String)} resolves the authenticated user and
 * delegates to the booking module's repository for that user's booking ids.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceBookingIdsTest {

    private static final String EMAIL = "traveler@travelai.io";

    @Mock private UserRepository userRepository;
    @Mock private UserPreferencesRepository preferencesRepository;
    @Mock private UserMapper userMapper;
    @Mock private BookingRepository bookingRepository;

    private UserService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new UserService(userRepository, preferencesRepository, userMapper, bookingRepository);
        user = new User();
        user.setEmail(EMAIL);
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
    }

    @Test
    @DisplayName("returns the ids of every booking belonging to the authenticated user")
    void returnsBookingIdsForUser() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        Booking first = new Booking();
        ReflectionTestUtils.setField(first, "id", UUID.randomUUID());
        Booking second = new Booking();
        ReflectionTestUtils.setField(second, "id", UUID.randomUUID());
        when(bookingRepository.findByUserId(user.getId())).thenReturn(List.of(first, second));

        List<UUID> ids = service.getBookingIds(EMAIL);

        assertThat(ids).containsExactly(first.getId(), second.getId());
    }

    @Test
    @DisplayName("returns an empty list when the user has no bookings")
    void returnsEmptyListWhenNoBookings() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(bookingRepository.findByUserId(user.getId())).thenReturn(List.of());

        assertThat(service.getBookingIds(EMAIL)).isEmpty();
    }

    @Test
    @DisplayName("throws USER_NOT_FOUND when the email does not resolve to a user")
    void throwsWhenUserMissing() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getBookingIds(EMAIL))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> assertThat(((TravelAiException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.USER_NOT_FOUND));
    }
}
