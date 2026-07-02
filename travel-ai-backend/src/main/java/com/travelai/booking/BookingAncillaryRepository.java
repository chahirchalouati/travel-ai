package com.travelai.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BookingAncillaryRepository extends JpaRepository<BookingAncillary, UUID> {
}
