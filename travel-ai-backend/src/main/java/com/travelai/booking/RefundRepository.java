package com.travelai.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RefundRepository extends JpaRepository<Refund, UUID> {
    Optional<Refund> findFirstByBookingIdOrderByCreatedAtDesc(UUID bookingId);
}
