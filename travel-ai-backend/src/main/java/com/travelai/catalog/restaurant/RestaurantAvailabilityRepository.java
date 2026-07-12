package com.travelai.catalog.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RestaurantAvailabilityRepository extends JpaRepository<RestaurantAvailability, UUID> {

    List<RestaurantAvailability> findByRestaurantIdAndDateAndCoversAvailableGreaterThan(
            UUID restaurantId, LocalDate date, short minCovers);

    Optional<RestaurantAvailability> findByRestaurantIdAndDateAndTimeSlot(
            UUID restaurantId, LocalDate date, LocalTime timeSlot);
}
