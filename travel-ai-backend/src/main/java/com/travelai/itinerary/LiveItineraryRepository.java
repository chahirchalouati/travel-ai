package com.travelai.itinerary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LiveItineraryRepository extends JpaRepository<LiveItinerary, UUID> {

    Optional<LiveItinerary> findByBookingId(UUID bookingId);

    List<LiveItinerary> findAllByWatchEnabledTrue();

    boolean existsByBookingId(UUID bookingId);
}
