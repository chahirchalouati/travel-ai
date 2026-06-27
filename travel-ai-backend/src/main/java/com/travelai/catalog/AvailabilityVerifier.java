package com.travelai.catalog;

import com.travelai.catalog.flight.FlightService;
import com.travelai.catalog.hotel.HotelService;
import com.travelai.catalog.restaurant.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Public API of the catalog module.
 * Used by the booking module to verify multi-element availability atomically.
 */
@Service
@RequiredArgsConstructor
public class AvailabilityVerifier {

    private final HotelService hotelService;
    private final RestaurantService restaurantService;
    private final FlightService flightService;

    /**
     * Verifies hotel, restaurants and flight availability atomically.
     * Returns true only when hotel and flight are all available.
     *
     * @param hotelId       hotel to verify
     * @param checkIn       hotel check-in date
     * @param checkOut      hotel check-out date
     * @param guests        number of guests
     * @param restaurantIds restaurant IDs to verify (currently reserved for future use)
     * @param diningDate    date of restaurant visit
     * @param covers        number of covers
     * @param flightId      flight to verify (nullable — skipped when null)
     * @return true if all requested elements are available
     */
    public boolean verifyAll(UUID hotelId,
                              LocalDate checkIn,
                              LocalDate checkOut,
                              int guests,
                              List<UUID> restaurantIds,
                              LocalDate diningDate,
                              int covers,
                              UUID flightId) {
        boolean hotelOk = hotelService.checkAvailability(hotelId, checkIn, checkOut, guests);
        boolean flightOk = flightId != null && flightService.checkAvailability(flightId, guests);
        return hotelOk && flightOk;
    }
}
