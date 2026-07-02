package com.travelai.booking;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @EntityGraph(attributePaths = {"travelers"})
    @Query(value = "SELECT b FROM Booking b WHERE b.user.email = :email",
           countQuery = "SELECT count(b) FROM Booking b WHERE b.user.email = :email")
    Page<Booking> findByUserEmail(@Param("email") String email, Pageable pageable);

    @EntityGraph(attributePaths = {"travelers"})
    Optional<Booking> findByIdAndUserEmail(UUID id, String email);

    Optional<Booking> findByBookingReference(String reference);

    /** All bookings of a user, regardless of status. Used by trip budget aggregation. */
    java.util.List<Booking> findByUserId(UUID userId);

    @EntityGraph(attributePaths = {"travelers"})
    java.util.List<Booking> findByTripGroupIdAndUserEmail(UUID tripGroupId, String email);

    /**
     * True when the user has a confirmed or completed booking referencing the given target
     * (hotel, restaurant, or flight). Used to mark reviews as verified stays.
     */
    @Query("""
            SELECT COUNT(b) > 0 FROM Booking b
            WHERE b.user.id = :userId
              AND b.status IN (com.travelai.booking.BookingStatus.CONFIRMED, com.travelai.booking.BookingStatus.COMPLETED)
              AND (b.hotelId = :targetId OR b.restaurantId = :targetId OR b.flightId = :targetId)
            """)
    boolean existsConfirmedBookingForTarget(@Param("userId") UUID userId, @Param("targetId") UUID targetId);
}
