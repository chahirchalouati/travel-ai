package com.travelai.catalog.flight;

import com.travelai.catalog.flight.dto.FlightSearchRequest;
import com.travelai.catalog.flight.dto.FlightSearchResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyShort;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FlightServiceTest {

    @Mock private FlightRepository flightRepository;
    @Mock private AirportLookup airportLookup;

    private FlightService flightService;

    @BeforeEach
    void setUp() {
        flightService = new FlightService(flightRepository, airportLookup);
    }

    @Test
    @DisplayName("search enriches results with destination city, country and country code")
    void search_resolvesAirportsForGrouping() {
        Flight flight = flight("FCO", "JFK");
        when(flightRepository.findByActiveTrueAndDepartureAtBetweenAndSeatsAvailableGreaterThan(
                any(), any(), anyShort())).thenReturn(List.of(flight));
        when(airportLookup.find("FCO")).thenReturn(Optional.of(airport("FCO", "Rome", "Italy", "IT")));
        when(airportLookup.find("JFK")).thenReturn(Optional.of(airport("JFK", "New York", "United States", "US")));

        List<FlightSearchResult> results = flightService.search(request());

        assertThat(results).singleElement().satisfies(r -> {
            assertThat(r.originCity()).isEqualTo("Rome");
            assertThat(r.destCity()).isEqualTo("New York");
            assertThat(r.destCountry()).isEqualTo("United States");
            assertThat(r.destCountryCode()).isEqualTo("US");
        });
    }

    @Test
    @DisplayName("search leaves location fields null when an IATA code is unmapped")
    void search_unmappedAirport_yieldsNullLocation() {
        Flight flight = flight("FCO", "ZZZ");
        when(flightRepository.findByActiveTrueAndDepartureAtBetweenAndSeatsAvailableGreaterThan(
                any(), any(), anyShort())).thenReturn(List.of(flight));
        when(airportLookup.find("FCO")).thenReturn(Optional.of(airport("FCO", "Rome", "Italy", "IT")));
        when(airportLookup.find("ZZZ")).thenReturn(Optional.empty());

        List<FlightSearchResult> results = flightService.search(request());

        assertThat(results).singleElement().satisfies(r -> {
            assertThat(r.destCity()).isNull();
            assertThat(r.destCountry()).isNull();
            assertThat(r.destCountryCode()).isNull();
        });
    }

    private static FlightSearchRequest request() {
        return new FlightSearchRequest(null, null, LocalDate.now(), 1, null);
    }

    private static Flight flight(String origin, String dest) {
        Flight f = new Flight();
        f.setId(UUID.randomUUID());
        f.setAirline("ITA Airways");
        f.setFlightNumber("AZ100");
        f.setOriginIata(origin);
        f.setDestIata(dest);
        f.setDepartureAt(Instant.now());
        f.setArrivalAt(Instant.now().plusSeconds(3600));
        f.setPrice(new BigDecimal("199.00"));
        f.setSeatsAvailable((short) 50);
        f.setBaggageIncluded(true);
        f.setActive(true);
        return f;
    }

    private static Airport airport(String iata, String city, String country, String code) {
        return new Airport(iata, city, null, country, code);
    }
}
