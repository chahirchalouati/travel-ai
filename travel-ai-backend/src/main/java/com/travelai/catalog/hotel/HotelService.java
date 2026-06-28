package com.travelai.catalog.hotel;

import com.travelai.catalog.hotel.dto.HotelSearchRequest;
import com.travelai.catalog.hotel.dto.HotelSearchResult;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class HotelService {

    private final HotelRepository hotelRepository;
    private final HotelAvailabilityRepository hotelAvailabilityRepository;

    /**
     * Searches available hotels matching budget, dates and constraints.
     */
    @Cacheable(value = "hotels-search",
            key = "#request.city + '-' + #request.checkIn + '-' + #request.checkOut + '-' + #request.maxBudget")
    public List<HotelSearchResult> search(HotelSearchRequest request) {
        // Browse mode: when no dates are supplied (e.g. the public hotels listing),
        // skip availability/budget filtering and simply return active hotels.
        boolean browse = request.checkIn() == null || request.checkOut() == null;
        int nights = browse ? 1 : (int) ChronoUnit.DAYS.between(request.checkIn(), request.checkOut());

        List<Hotel> candidates = request.city() != null
                ? hotelRepository.findByActiveTrueAndCityIgnoreCase(request.city())
                : hotelRepository.findByActiveTrue(Pageable.unpaged());

        return candidates.stream()
                .filter(h -> browse || isAvailable(h.getId(), request.checkIn(), request.checkOut()))
                .filter(h -> meetsConstraints(h, request.constraints()))
                .filter(h -> request.maxBudget() == null
                        || (h.getBasePriceNight() != null
                        && h.getBasePriceNight()
                        .multiply(BigDecimal.valueOf(nights))
                        .compareTo(request.maxBudget()) <= 0))
                .map(h -> toResult(h, nights))
                .toList();
    }

    /**
     * Checks real-time availability for a specific hotel and date range.
     */
    public boolean checkAvailability(UUID hotelId, LocalDate from, LocalDate to, int guests) {
        return isAvailable(hotelId, from, to);
    }

    /**
     * Returns hotel by ID or throws NOT_FOUND.
     */
    public HotelSearchResult getById(UUID id) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.HOTEL_NOT_FOUND));
        return toResult(hotel, 1);
    }

    // --- private helpers ---

    private boolean isAvailable(UUID hotelId, LocalDate from, LocalDate to) {
        List<HotelAvailability> slots = hotelAvailabilityRepository
                .findByHotelIdAndDateBetweenAndRoomsAvailableGreaterThan(hotelId, from, to, (short) 0);
        long requiredNights = ChronoUnit.DAYS.between(from, to);
        return slots.size() >= requiredNights;
    }

    private boolean meetsConstraints(Hotel hotel, List<String> constraints) {
        if (constraints == null || constraints.isEmpty()) {
            return true;
        }
        for (String constraint : constraints) {
            boolean met = switch (constraint.toLowerCase()) {
                case "sea" -> hotel.isSeaProximity();
                case "pets" -> hotel.isPetFriendly();
                case "accessible" -> hotel.isAccessible();
                case "family" -> hotel.isFamilyFriendly();
                default -> true;
            };
            if (!met) {
                return false;
            }
        }
        return true;
    }

    private HotelSearchResult toResult(Hotel hotel, int nights) {
        BigDecimal pricePerNight = hotel.getBasePriceNight() != null
                ? hotel.getBasePriceNight()
                : BigDecimal.ZERO;
        BigDecimal totalPrice = pricePerNight.multiply(BigDecimal.valueOf(nights));
        UUID partnerId = hotel.getPartner() != null ? hotel.getPartner().getId() : null;

        return new HotelSearchResult(
                hotel.getId(),
                hotel.getName(),
                hotel.getStars(),
                hotel.getCity(),
                hotel.getDescription(),
                hotel.getImageUrl(),
                pricePerNight,
                totalPrice,
                hotel.isPetFriendly(),
                hotel.isAccessible(),
                hotel.isFamilyFriendly(),
                hotel.isSeaProximity(),
                true,
                partnerId
        );
    }
}
