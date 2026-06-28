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
}
