package com.travelai.partner;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface PartnerRepository extends JpaRepository<Partner, UUID> {

    Page<Partner> findByActiveTrue(Pageable pageable);

    Page<Partner> findByTypeAndActiveTrue(PartnerType type, Pageable pageable);

    Optional<Partner> findByIdAndActiveTrue(UUID id);

    boolean existsByContactEmail(String email);

    long countByStatus(PartnerStatus status);

    long countByStatusIn(Collection<PartnerStatus> statuses);
}
