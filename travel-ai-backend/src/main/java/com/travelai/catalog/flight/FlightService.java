package com.travelai.catalog.flight;

import com.travelai.catalog.flight.dto.FareCalendarDay;
import com.travelai.catalog.flight.dto.FlightSearchRequest;
import com.travelai.catalog.flight.dto.FlightSearchResult;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightService {

    private final FlightRepository flightRepository;
    private final AirportLookup airportLookup;

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
     * Cheapest fare per departure day for a route, over {@code days} days from
     * {@code from}. Days with no flights are omitted. Powers the fare-calendar strip.
     */
    @Cacheable(value = "flights-fare-calendar",
            key = "#originIata + '-' + #destIata + '-' + #from + '-' + #days")
    public List<FareCalendarDay> fareCalendar(String originIata, String destIata, LocalDate from, int days) {
        int span = Math.max(1, Math.min(60, days));
        Instant start = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant end = from.plusDays(span).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<Flight> flights = flightRepository
                .findByActiveTrueAndOriginIataAndDestIataAndDepartureAtBetween(originIata, destIata, start, end);

        Map<LocalDate, FareCalendarDay> byDay = new TreeMap<>();
        for (Flight f : flights) {
            LocalDate day = f.getDepartureAt().atZone(ZoneOffset.UTC).toLocalDate();
            byDay.merge(day,
                    new FareCalendarDay(day, f.getPrice(), 1),
                    (a, b) -> new FareCalendarDay(day, a.minPrice().min(b.minPrice()), a.flightCount() + b.flightCount()));
        }
        return byDay.values().stream()
                .sorted(Comparator.comparing(FareCalendarDay::date))
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
        Airport origin = airportLookup.find(flight.getOriginIata()).orElse(null);
        Airport dest = airportLookup.find(flight.getDestIata()).orElse(null);
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
                flight.isBaggageIncluded(),
                origin == null ? null : origin.getCity(),
                origin == null ? null : origin.getCountry(),
                dest == null ? null : dest.getCity(),
                dest == null ? null : dest.getCountry(),
                dest == null ? null : dest.getCountryCode()
        );
    }
}
