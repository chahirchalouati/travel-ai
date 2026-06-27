package com.travelai.catalog.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RestaurantRepository extends JpaRepository<Restaurant, UUID> {

    List<Restaurant> findByActiveTrueAndCityIgnoreCase(String city);

    List<Restaurant> findByActiveTrueAndCityIgnoreCaseAndPriceTierLessThanEqual(String city, short maxTier);

    List<Restaurant> findByActiveTrueAndCityIgnoreCaseAndCuisineTypeIgnoreCase(String city, String cuisine);

    List<Restaurant> findByActiveTrue();
}
