package com.travelai.destination;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DestinationRepository extends JpaRepository<Destination, UUID> {

    Page<Destination> findByActiveTrue(Pageable pageable);

    Optional<Destination> findFirstByNameIgnoreCaseAndActiveTrue(String name);

    List<Destination> findByFeaturedTrueAndActiveTrue();

    List<Destination> findByCountryIgnoreCaseAndActiveTrue(String country);

    List<Destination> findByContinentIgnoreCaseAndActiveTrue(String continent);

    @Query("SELECT d FROM Destination d WHERE d.active = true AND ("
            + "LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(d.country) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(d.tags) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Destination> searchByNameOrCountry(@Param("query") String query, Pageable pageable);

    Page<Destination> findByActiveTrueOrderByPopularityScoreDesc(Pageable pageable);

    @Query("SELECT d FROM Destination d WHERE d.active = true ORDER BY d.popularityScore DESC")
    List<Destination> findActiveOrderByPopularity();

    @Query("SELECT COUNT(DISTINCT d.country) FROM Destination d WHERE d.active = true")
    long countDistinctCountries();
}
