package com.travelai.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BookingTravelerRepository extends JpaRepository<BookingTraveler, UUID> {
    List<BookingTraveler> findByBookingId(UUID bookingId);
}
