package com.travelai.catalog.hotel;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface HotelRepository extends JpaRepository<Hotel, UUID>, JpaSpecificationExecutor<Hotel> {

    /** Distinct active-hotel cities whose name starts with the given prefix (case-insensitive). */
    @Query("""
            select distinct h.city from Hotel h
            where h.active = true and h.city is not null
              and lower(h.city) like lower(concat(:q, '%'))
            order by h.city
            """)
    List<String> suggestCities(@Param("q") String q, Pageable limit);

    List<Hotel> findByActiveTrueAndCityIgnoreCase(String city);

    List<Hotel> findByActiveTrueAndCityIgnoreCaseAndPetFriendlyTrue(String city);

    List<Hotel> findByActiveTrueAndCityIgnoreCaseAndAccessibleTrue(String city);

    List<Hotel> findByActiveTrueAndCityIgnoreCaseAndFamilyFriendlyTrue(String city);

    List<Hotel> findByActiveTrueAndCityIgnoreCaseAndSeaProximityTrue(String city);

    List<Hotel> findByActiveTrue(Pageable pageable);
}
