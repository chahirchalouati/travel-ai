package com.travelai.catalog.suggest;

import com.travelai.attraction.AttractionRepository;
import com.travelai.catalog.cruise.CruiseRepository;
import com.travelai.catalog.flight.AirportRepository;
import com.travelai.catalog.hotel.HotelRepository;
import com.travelai.catalog.restaurant.RestaurantRepository;
import com.travelai.catalog.suggest.dto.Suggestion;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Serves lightweight typeahead suggestions for catalog filter fields.
 * All queries are prefix-matched, case-insensitive and capped to a small limit
 * so they stay cheap enough to run on every keystroke.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SuggestService {

    /** Minimum query length before we bother hitting the database. */
    private static final int MIN_QUERY_LENGTH = 2;
    /** Maximum suggestions returned per request. */
    private static final int MAX_RESULTS = 8;
    private static final Pageable LIMIT = PageRequest.of(0, MAX_RESULTS);

    private final HotelRepository hotelRepository;
    private final RestaurantRepository restaurantRepository;
    private final CruiseRepository cruiseRepository;
    private final AttractionRepository attractionRepository;
    private final AirportRepository airportRepository;

    public List<Suggestion> hotelCities(String q) {
        return plain(query(q, hotelRepository::suggestCities));
    }

    public List<Suggestion> restaurantCities(String q) {
        return plain(query(q, restaurantRepository::suggestCities));
    }

    public List<Suggestion> cuisines(String q) {
        return plain(query(q, restaurantRepository::suggestCuisines));
    }

    public List<Suggestion> cruisePorts(String q) {
        return plain(query(q, cruiseRepository::suggestPorts));
    }

    public List<Suggestion> cruiseTypes(String q) {
        return plain(query(q, cruiseRepository::suggestTypes));
    }

    public List<Suggestion> attractionCities(String q) {
        return plain(query(q, attractionRepository::suggestCities));
    }

    /** Airports as "City (IATA)" with the country as a hint. */
    public List<Suggestion> airports(String q) {
        if (isTooShort(q)) {
            return List.of();
        }
        return airportRepository.suggest(q.trim(), LIMIT).stream()
                .map(a -> new Suggestion(
                        a.getIata(),
                        "%s (%s)".formatted(a.getCity(), a.getIata()),
                        a.getCountry()))
                .toList();
    }

    private interface PrefixQuery {
        List<String> run(String q, Pageable limit);
    }

    private List<String> query(String q, PrefixQuery source) {
        if (isTooShort(q)) {
            return List.of();
        }
        return source.run(q.trim(), LIMIT);
    }

    private static boolean isTooShort(String q) {
        return q == null || q.trim().length() < MIN_QUERY_LENGTH;
    }

    private static List<Suggestion> plain(List<String> values) {
        return values.stream().map(Suggestion::of).toList();
    }
}
