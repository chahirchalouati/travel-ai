package com.travelai.catalog.hotel;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface HotelRepository extends JpaRepository<Hotel, UUID>, JpaSpecificationExecutor<Hotel> {

    List<Hotel> findByActiveTrueAndCityIgnoreCase(String city);

    List<Hotel> findByActiveTrueAndCityIgnoreCaseAndPetFriendlyTrue(String city);

    List<Hotel> findByActiveTrueAndCityIgnoreCaseAndAccessibleTrue(String city);

    List<Hotel> findByActiveTrueAndCityIgnoreCaseAndFamilyFriendlyTrue(String city);

    List<Hotel> findByActiveTrueAndCityIgnoreCaseAndSeaProximityTrue(String city);

    List<Hotel> findByActiveTrue(Pageable pageable);
}
