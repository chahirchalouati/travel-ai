package com.travelai.tripcollab;

import com.travelai.auth.UserRepository;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Central authority for who may see or change a trip. A trip is keyed by the
 * booking id. Access levels:
 *
 * <ul>
 *   <li>{@code OWNER} — the user who made the booking; full control.</li>
 *   <li>{@code EDITOR} — accepted companion with EDITOR role; may mutate segments
 *       (report disruptions, approve/reject re-plans) like the owner.</li>
 *   <li>{@code VIEWER} — accepted companion with VIEWER role; read + vote only.</li>
 *   <li>{@code NONE} — everyone else; no access.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class TripAccessService {

    private final BookingRepository bookingRepository;
    private final TripMemberRepository memberRepository;
    private final UserRepository userRepository;

    /** Resolves the caller's effective access level on the trip. */
    @Transactional(readOnly = true)
    public TripAccessLevel levelFor(UUID tripId, String userEmail) {
        Booking booking = bookingRepository.findById(tripId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));
        if (booking.getUser() != null && booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            return TripAccessLevel.OWNER;
        }
        return userRepository.findByEmail(userEmail)
                .flatMap(user -> memberRepository.findByTripIdAndUserIdAndStatus(
                        tripId, user.getId(), TripMemberStatus.ACCEPTED))
                .map(member -> member.getRole() == TripRole.EDITOR
                        ? TripAccessLevel.EDITOR
                        : TripAccessLevel.VIEWER)
                .orElse(TripAccessLevel.NONE);
    }

    /** Owner or any accepted member. Throws 403 otherwise. */
    @Transactional(readOnly = true)
    public TripAccessLevel requireView(UUID tripId, String userEmail) {
        TripAccessLevel level = levelFor(tripId, userEmail);
        if (!level.canView()) {
            throw TravelAiException.forbidden(ErrorCode.ACCESS_DENIED);
        }
        return level;
    }

    /** Owner or accepted EDITOR. Throws 403 otherwise. */
    @Transactional(readOnly = true)
    public TripAccessLevel requireEdit(UUID tripId, String userEmail) {
        TripAccessLevel level = levelFor(tripId, userEmail);
        if (!level.canEdit()) {
            throw TravelAiException.forbidden(ErrorCode.ACCESS_DENIED);
        }
        return level;
    }

    /** Owner only. Throws 403 otherwise. */
    @Transactional(readOnly = true)
    public void requireOwner(UUID tripId, String userEmail) {
        if (levelFor(tripId, userEmail) != TripAccessLevel.OWNER) {
            throw TravelAiException.forbidden(ErrorCode.ACCESS_DENIED);
        }
    }
}
