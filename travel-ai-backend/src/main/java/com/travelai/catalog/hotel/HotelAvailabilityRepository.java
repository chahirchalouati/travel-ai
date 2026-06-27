package com.travelai.catalog.hotel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HotelAvailabilityRepository extends JpaRepository<HotelAvailability, UUID> {

    List<HotelAvailability> findByHotelIdAndDateBetweenAndRoomsAvailableGreaterThan(
            UUID hotelId, LocalDate from, LocalDate to, short minRooms);

    Optional<HotelAvailability> findByHotelIdAndDate(UUID hotelId, LocalDate date);
}
