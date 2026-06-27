package com.travelai.payment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Page<Payment> findByUserEmail(String email, Pageable pageable);
    List<Payment> findByBookingId(UUID bookingId);
    Optional<Payment> findByGatewayReference(String reference);
}
