package com.travelai.catalog.flight;

import com.travelai.catalog.flight.dto.FlightSearchRequest;
import com.travelai.catalog.flight.dto.FlightSearchResult;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightService {

    private final FlightRepository flightRepository;

    /**
     * Searches flights matching origin, destination, departure date and budget.
     */
    @Cacheable(value = "flights-search",
            key = "#request.originIata + '-' + #request.destIata + '-' + #request.departureDate + '-' + #request.passengers + '-' + #request.maxPrice")
    public List<FlightSearchResult> search(FlightSearchRequest request) {
        Instant dayStart = request.departureDate().atStartOfDay().toInstant(ZoneOffset.UTC);
        // Search within a 30-day window to account for flexible dates and data availability
        Instant dayEnd = request.departureDate().plusDays(30).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<Flight> candidates;
        if (request.originIata() != null && request.destIata() != null) {
            candidates = flightRepository.findByActiveTrueAndOriginIataAndDestIataAndDepartureAtBetweenAndSeatsAvailableGreaterThan(
                    request.originIata(), request.destIata(), dayStart, dayEnd, (short) request.passengers());
        } else {
            // No specific route requested — return any available flights in the window
            candidates = flightRepository.findByActiveTrueAndDepartureAtBetweenAndSeatsAvailableGreaterThan(
                    dayStart, dayEnd, (short) request.passengers());
        }

        return candidates.stream()
                .filter(f -> request.maxPrice() == null || f.getPrice().compareTo(request.maxPrice()) <= 0)
                .map(this::toResult)
                .toList();
    }

    /**
     * Returns flight by ID or throws NOT_FOUND.
     */
    public FlightSearchResult getById(UUID id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.FLIGHT_NOT_FOUND));
        return toResult(flight);
    }

    /**
     * Checks availability of a specific flight for the requested number of seats.
     */
    public boolean checkAvailability(UUID flightId, int seats) {
        return flightRepository.findById(flightId)
                .map(f -> f.isActive() && f.getSeatsAvailable() >= seats)
                .orElse(false);
    }

    // --- private helpers ---

    private FlightSearchResult toResult(Flight flight) {
        return new FlightSearchResult(
                flight.getId(),
                flight.getAirline(),
                flight.getFlightNumber(),
                flight.getOriginIata(),
                flight.getDestIata(),
                flight.getDepartureAt(),
                flight.getArrivalAt(),
                flight.getPrice(),
                flight.getSeatsAvailable(),
                flight.isBaggageIncluded()
        );
    }
}
