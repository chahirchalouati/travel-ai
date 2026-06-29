package com.travelai.itinerary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ItineraryEventRepository extends JpaRepository<ItineraryEvent, UUID> {

    List<ItineraryEvent> findBySegmentId(UUID segmentId);
}
