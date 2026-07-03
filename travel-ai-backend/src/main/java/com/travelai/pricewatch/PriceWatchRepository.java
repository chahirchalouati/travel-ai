package com.travelai.pricewatch;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PriceWatchRepository extends JpaRepository<PriceWatch, UUID> {

    List<PriceWatch> findByUserEmailOrderByCreatedAtDesc(String email);

    // The scheduler reads w.getUser() for every firing watch — fetch it eagerly.
    @EntityGraph(attributePaths = {"user"})
    List<PriceWatch> findByActiveTrue();

    Optional<PriceWatch> findByIdAndUserEmail(UUID id, String email);

    Optional<PriceWatch> findByUserEmailAndFlightId(String email, UUID flightId);

    Optional<PriceWatch> findByUserEmailAndCruiseId(String email, UUID cruiseId);
}
