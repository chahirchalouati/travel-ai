package com.travelai.catalog.restaurant;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RestaurantRepository extends JpaRepository<Restaurant, UUID>, JpaSpecificationExecutor<Restaurant> {

    /** Distinct active-restaurant cities matching the prefix (case-insensitive). */
    @Query("""
            select distinct r.city from Restaurant r
            where r.active = true and r.city is not null
              and lower(r.city) like lower(concat(:q, '%'))
            order by r.city
            """)
    List<String> suggestCities(@Param("q") String q, Pageable limit);

    /** Distinct cuisine types matching the prefix (case-insensitive). */
    @Query("""
            select distinct r.cuisineType from Restaurant r
            where r.active = true and r.cuisineType is not null
              and lower(r.cuisineType) like lower(concat(:q, '%'))
            order by r.cuisineType
            """)
    List<String> suggestCuisines(@Param("q") String q, Pageable limit);

    List<Restaurant> findByActiveTrueAndCityIgnoreCase(String city);

    List<Restaurant> findByActiveTrueAndCityIgnoreCaseAndPriceTierLessThanEqual(String city, short maxTier);

    List<Restaurant> findByActiveTrueAndCityIgnoreCaseAndCuisineTypeIgnoreCase(String city, String cuisine);

    List<Restaurant> findByActiveTrue();
}
