package com.travelai.catalog.cruise;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CruiseCabinCategoryRepository extends JpaRepository<CruiseCabinCategory, UUID> {

    List<CruiseCabinCategory> findByCruiseIdOrderBySortOrder(UUID cruiseId);
}
