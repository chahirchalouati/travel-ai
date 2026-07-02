package com.travelai.ancillary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AncillaryOptionRepository extends JpaRepository<AncillaryOption, UUID> {

    List<AncillaryOption> findByActiveTrueOrderBySortOrderAsc();

    Optional<AncillaryOption> findByCodeIgnoreCase(String code);
}
