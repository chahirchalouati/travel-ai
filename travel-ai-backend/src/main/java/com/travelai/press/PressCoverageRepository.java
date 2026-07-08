package com.travelai.press;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PressCoverageRepository extends JpaRepository<PressCoverage, UUID> {

    List<PressCoverage> findByActiveTrueOrderBySortOrderAsc();
}
