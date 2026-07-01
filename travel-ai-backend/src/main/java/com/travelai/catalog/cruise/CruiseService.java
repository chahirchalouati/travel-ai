package com.travelai.catalog.cruise;

import com.travelai.catalog.cruise.dto.CruiseCabin;
import com.travelai.catalog.cruise.dto.CruiseDay;
import com.travelai.catalog.cruise.dto.CruiseSearchRequest;
import com.travelai.catalog.cruise.dto.CruiseSearchResult;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CruiseService {

    private final CruiseRepository cruiseRepository;
    private final CruiseCabinCategoryRepository cabinRepository;
    private final CruiseItineraryDayRepository itineraryRepository;

    @Cacheable(value = "cruises-search",
            key = "#request.departurePort + '-' + #request.cruiseType + '-' + #request.departureDate + '-' + #request.passengers + '-' + #request.maxPrice")
    public List<CruiseSearchResult> search(CruiseSearchRequest request) {
        LocalDate from = request.departureDate() != null ? request.departureDate() : LocalDate.now();
        int minCabins = Math.max(1, request.passengers());

        List<Cruise> candidates = resolveCandidates(from, minCabins, request);

        return candidates.stream()
                .filter(c -> request.maxPrice() == null || c.getPricePerPerson().compareTo(request.maxPrice()) <= 0)
                .map(this::toResult)
                .toList();
    }

    public CruiseSearchResult getById(UUID id) {
        Cruise cruise = cruiseRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.CRUISE_NOT_FOUND));
        return toResult(cruise);
    }

    /** Bookable cabin tiers for a cruise, priced from its per-person base. */
    public List<CruiseCabin> cabins(UUID cruiseId) {
        Cruise cruise = cruiseRepository.findById(cruiseId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.CRUISE_NOT_FOUND));
        BigDecimal base = cruise.getPricePerPerson();
        return cabinRepository.findByCruiseIdOrderBySortOrder(cruiseId).stream()
                .map(c -> new CruiseCabin(
                        c.getName(),
                        c.getDescription(),
                        c.getPriceMultiplier(),
                        base.multiply(c.getPriceMultiplier()).setScale(2, RoundingMode.HALF_UP),
                        c.getCabinsAvailable()))
                .toList();
    }

    /** Day-by-day itinerary for a cruise, ordered by day. */
    public List<CruiseDay> itinerary(UUID cruiseId) {
        return itineraryRepository.findByCruiseIdOrderByDayNumber(cruiseId).stream()
                .map(d -> new CruiseDay(d.getDayNumber(), d.getPort(), d.getDescription()))
                .toList();
    }

    private List<Cruise> resolveCandidates(LocalDate from, int minCabins, CruiseSearchRequest request) {
        String port = request.departurePort();
        String type = request.cruiseType();

        if (port != null && type != null) {
            return cruiseRepository
                    .findByActiveTrueAndDepartureDateGreaterThanEqualAndCabinsAvailableGreaterThanAndDeparturePortIgnoreCaseAndCruiseTypeIgnoreCase(
                            from, minCabins, port, type);
        }
        if (port != null) {
            return cruiseRepository
                    .findByActiveTrueAndDepartureDateGreaterThanEqualAndCabinsAvailableGreaterThanAndDeparturePortIgnoreCase(
                            from, minCabins, port);
        }
        if (type != null) {
            return cruiseRepository
                    .findByActiveTrueAndDepartureDateGreaterThanEqualAndCabinsAvailableGreaterThanAndCruiseTypeIgnoreCase(
                            from, minCabins, type);
        }
        return cruiseRepository
                .findByActiveTrueAndDepartureDateGreaterThanEqualAndCabinsAvailableGreaterThan(from, minCabins);
    }

    private CruiseSearchResult toResult(Cruise cruise) {
        return new CruiseSearchResult(
                cruise.getId(),
                cruise.getOperator(),
                cruise.getName(),
                cruise.getShipName(),
                cruise.getDeparturePort(),
                cruise.getArrivalPort(),
                cruise.getDepartureDate(),
                cruise.getReturnDate(),
                cruise.getDurationNights(),
                cruise.getPricePerPerson(),
                cruise.getCabinsAvailable(),
                cruise.getCruiseType(),
                cruise.getDescription(),
                cruise.getImageUrl(),
                cruise.getItinerary(),
                cruise.isAllInclusive()
        );
    }
}
