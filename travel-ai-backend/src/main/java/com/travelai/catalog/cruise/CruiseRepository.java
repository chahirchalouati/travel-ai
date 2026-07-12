package com.travelai.catalog.cruise;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CruiseRepository extends JpaRepository<Cruise, UUID>, JpaSpecificationExecutor<Cruise> {

    /** Distinct departure ports matching the prefix (case-insensitive). */
    @Query("""
            select distinct c.departurePort from Cruise c
            where c.active = true and c.departurePort is not null
              and lower(c.departurePort) like lower(concat(:q, '%'))
            order by c.departurePort
            """)
    List<String> suggestPorts(@Param("q") String q, Pageable limit);

    /** Distinct cruise types matching the prefix (case-insensitive). */
    @Query("""
            select distinct c.cruiseType from Cruise c
            where c.active = true and c.cruiseType is not null
              and lower(c.cruiseType) like lower(concat(:q, '%'))
            order by c.cruiseType
            """)
    List<String> suggestTypes(@Param("q") String q, Pageable limit);

    List<Cruise> findByActiveTrue();

    List<Cruise> findByActiveTrueAndDepartureDateGreaterThanEqualAndCabinsAvailableGreaterThan(
            LocalDate from, int minCabins);

    List<Cruise> findByActiveTrueAndDepartureDateGreaterThanEqualAndCabinsAvailableGreaterThanAndDeparturePortIgnoreCase(
            LocalDate from, int minCabins, String departurePort);

    List<Cruise> findByActiveTrueAndDepartureDateGreaterThanEqualAndCabinsAvailableGreaterThanAndCruiseTypeIgnoreCase(
            LocalDate from, int minCabins, String cruiseType);

    List<Cruise> findByActiveTrueAndDepartureDateGreaterThanEqualAndCabinsAvailableGreaterThanAndDeparturePortIgnoreCaseAndCruiseTypeIgnoreCase(
            LocalDate from, int minCabins, String departurePort, String cruiseType);
}
