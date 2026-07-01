package com.travelai.catalog.flight;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * In-memory IATA → {@link Airport} index. The reference set is tiny (~70 rows)
 * and effectively static, so it is loaded once on first use and held in memory
 * rather than hitting the database (or Redis) per flight.
 */
@Component
@RequiredArgsConstructor
public class AirportLookup {

    private final AirportRepository airportRepository;

    private volatile Map<String, Airport> index;

    /** Resolves an IATA code to its airport, or empty when unknown. */
    public Optional<Airport> find(String iata) {
        if (iata == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(index().get(iata.toUpperCase()));
    }

    private Map<String, Airport> index() {
        Map<String, Airport> local = index;
        if (local == null) {
            synchronized (this) {
                local = index;
                if (local == null) {
                    local = airportRepository.findAll().stream()
                            .collect(Collectors.toUnmodifiableMap(
                                    a -> a.getIata().toUpperCase(), Function.identity()));
                    index = local;
                }
            }
        }
        return local;
    }
}
