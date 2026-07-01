package com.travelai.catalog.restaurant;

import com.travelai.catalog.restaurant.dto.RestaurantSearchRequest;
import com.travelai.catalog.restaurant.dto.RestaurantSearchResult;
import com.travelai.catalog.restaurant.dto.RestaurantSlot;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantAvailabilityRepository restaurantAvailabilityRepository;

    /**
     * Searches available restaurants matching city, date, covers and optional cuisine.
     */
    @Cacheable(value = "restaurants-search",
            key = "#request.city + '-' + #request.date + '-' + #request.covers + '-' + #request.cuisineType")
    public List<RestaurantSearchResult> search(RestaurantSearchRequest request) {
        List<Restaurant> candidates = resolveCandidates(request);

        return candidates.stream()
                .filter(r -> isAvailable(r.getId(), request))
                .map(this::toResult)
                .toList();
    }

    /**
     * Returns restaurant by ID or throws NOT_FOUND.
     */
    public RestaurantSearchResult getById(UUID id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.RESTAURANT_NOT_FOUND));
        return toResult(restaurant);
    }

    /**
     * Returns bookable reservation slots for a restaurant on a date that can seat
     * at least {@code covers}, ordered by time. Empty when nothing is available.
     */
    public List<RestaurantSlot> availability(UUID restaurantId, LocalDate date, int covers) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.RESTAURANT_NOT_FOUND));
        short minCovers = (short) Math.max(0, covers - 1); // GreaterThan(covers-1) == >= covers
        return restaurantAvailabilityRepository
                .findByRestaurantIdAndDateAndCoversAvailableGreaterThan(restaurantId, date, minCovers)
                .stream()
                .sorted(Comparator.comparing(RestaurantAvailability::getTimeSlot))
                .map(a -> new RestaurantSlot(a.getTimeSlot(), a.getCoversAvailable()))
                .toList();
    }

    // --- private helpers ---

    private List<Restaurant> resolveCandidates(RestaurantSearchRequest request) {
        if (request.city() == null) {
            return restaurantRepository.findByActiveTrue();
        }
        if (request.cuisineType() != null) {
            return restaurantRepository.findByActiveTrueAndCityIgnoreCaseAndCuisineTypeIgnoreCase(
                    request.city(), request.cuisineType());
        }
        return restaurantRepository.findByActiveTrueAndCityIgnoreCase(request.city());
    }

    private boolean isAvailable(UUID restaurantId, RestaurantSearchRequest request) {
        if (request.date() == null) {
            return true;
        }
        List<RestaurantAvailability> slots = restaurantAvailabilityRepository
                .findByRestaurantIdAndDateAndCoversAvailableGreaterThan(
                        restaurantId, request.date(), (short) request.covers());
        return !slots.isEmpty();
    }

    private RestaurantSearchResult toResult(Restaurant restaurant) {
        UUID partnerId = restaurant.getPartner() != null ? restaurant.getPartner().getId() : null;
        return new RestaurantSearchResult(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getCuisineType(),
                restaurant.getPriceTier(),
                restaurant.getCity(),
                restaurant.getDescription(),
                restaurant.getImageUrl(),
                restaurant.isPetFriendly(),
                restaurant.isAccessible(),
                true,
                partnerId
        );
    }
}
