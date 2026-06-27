package com.travelai.catalog.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RestaurantAvailabilityRepository extends JpaRepository<RestaurantAvailability, UUID> {

    List<RestaurantAvailability> findByRestaurantIdAndDateAndCoversAvailableGreaterThan(
            UUID restaurantId, LocalDate date, short minCovers);
}
