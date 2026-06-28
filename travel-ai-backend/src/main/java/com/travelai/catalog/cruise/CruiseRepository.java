package com.travelai.catalog.cruise;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CruiseRepository extends JpaRepository<Cruise, UUID> {

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
