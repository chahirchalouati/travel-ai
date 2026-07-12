package com.travelai.itinerary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ItinerarySegmentRepository extends JpaRepository<ItinerarySegment, UUID> {

    List<ItinerarySegment> findByItineraryId(UUID itineraryId);
}
