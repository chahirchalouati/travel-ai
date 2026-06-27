package com.travelai.booking;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    Page<Booking> findByUserEmail(String email, Pageable pageable);
    Optional<Booking> findByIdAndUserEmail(UUID id, String email);
    Optional<Booking> findByBookingReference(String reference);
}
