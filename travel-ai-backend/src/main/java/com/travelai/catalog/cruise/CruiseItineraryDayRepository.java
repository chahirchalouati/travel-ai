package com.travelai.catalog.cruise;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CruiseItineraryDayRepository extends JpaRepository<CruiseItineraryDay, UUID> {

    List<CruiseItineraryDay> findByCruiseIdOrderByDayNumber(UUID cruiseId);
}
