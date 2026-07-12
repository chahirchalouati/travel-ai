package com.travelai.ai.planning;

import com.travelai.ai.planning.dto.AgentContext;
import com.travelai.ai.planning.dto.FlightOption;
import com.travelai.ai.planning.dto.HotelOption;
import com.travelai.ai.planning.dto.RankedProposal;
import com.travelai.ai.planning.dto.RestaurantOption;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RankingAgent {

    private static final int MAX_PROPOSALS = 3;

    private final ChatClient chatClient;

    public List<RankedProposal> rank(AgentContext ctx, List<HotelOption> hotels,
                                     List<RestaurantOption> restaurants, List<FlightOption> flights) {
        if (hotels.isEmpty() || restaurants.isEmpty() || flights.isEmpty()) {
            return List.of();
        }

        // Build geographically coherent proposals: pair a hotel with a restaurant in the
        // SAME city, one proposal per distinct city, so the planner never mixes (e.g.) a
        // Bali hotel with a Paris restaurant. Falls back to the legacy cross-pairing only
        // if no single city has both hotel and restaurant inventory within budget.
        List<RankedProposal> coherent = rankByCity(ctx, hotels, restaurants, flights);
        if (!coherent.isEmpty()) {
            return coherent;
        }
        return rankFallback(ctx, hotels, restaurants, flights);
    }

    private List<RankedProposal> rankByCity(AgentContext ctx, List<HotelOption> hotels,
                                            List<RestaurantOption> restaurants, List<FlightOption> flights) {
        Map<String, List<HotelOption>> hotelsByCity = hotels.stream()
                .filter(h -> h.city() != null && !h.city().isBlank())
                .collect(Collectors.groupingBy(h -> normalizeCity(h.city())));
        Map<String, List<RestaurantOption>> restaurantsByCity = restaurants.stream()
                .filter(r -> r.city() != null && !r.city().isBlank())
                .collect(Collectors.groupingBy(r -> normalizeCity(r.city())));

        int persons = Math.max(1, ctx.adultsCount() + ctx.childrenCount());
        FlightOption flight = cheapestFlight(flights);

        List<CityCandidate> candidates = new ArrayList<>();
        for (Map.Entry<String, List<HotelOption>> entry : hotelsByCity.entrySet()) {
            List<RestaurantOption> cityRestaurants = restaurantsByCity.get(entry.getKey());
            if (cityRestaurants == null) {
                continue;
            }
            HotelOption hotel = entry.getValue().stream()
                    .min(Comparator.comparing(HotelOption::totalCost))
                    .orElseThrow();
            RestaurantOption restaurant = cityRestaurants.stream()
                    .min(Comparator.comparing(RestaurantOption::estimatedCostPerPerson))
                    .orElseThrow();

            BigDecimal total = tripTotal(hotel, restaurant, flight, persons);
            if (total.compareTo(ctx.budget()) <= 0) {
                candidates.add(new CityCandidate(hotel.city(), hotel, restaurant, flight, total));
            }
        }

        // Anchor on the highest-quality stay, then spread the remaining picks as far apart
        // geographically as possible (farthest-point selection). This stops the planner from
        // returning, say, three Italian cities just because Italian 5-star stays happen to be
        // the cheapest at the top rating — the user sees a genuinely worldwide set.
        candidates.sort(Comparator.comparingDouble((CityCandidate c) -> c.hotel().rating()).reversed()
                .thenComparing(CityCandidate::total));

        List<CityCandidate> selected = selectGeographicallyDiverse(candidates);

        List<RankedProposal> proposals = new ArrayList<>();
        int rank = 100;
        for (CityCandidate c : selected) {
            proposals.add(buildProposal(ctx, c.hotel(), c.restaurant(), c.flight(), c.total(), rank--, c.city()));
        }
        return proposals;
    }

    /**
     * Greedy farthest-point sampling: keep the top-rated candidate, then repeatedly add the
     * candidate that is furthest from everything already chosen, so the proposals span the map.
     */
    private List<CityCandidate> selectGeographicallyDiverse(List<CityCandidate> sortedByQuality) {
        List<CityCandidate> pool = new ArrayList<>(sortedByQuality);
        List<CityCandidate> selected = new ArrayList<>();
        if (pool.isEmpty()) {
            return selected;
        }
        selected.add(pool.remove(0));

        while (selected.size() < MAX_PROPOSALS && !pool.isEmpty()) {
            CityCandidate best = null;
            double bestMinDistance = -1.0;
            for (CityCandidate candidate : pool) {
                double minDistance = selected.stream()
                        .mapToDouble(s -> distanceKm(candidate.hotel(), s.hotel()))
                        .min()
                        .orElse(0.0);
                if (minDistance > bestMinDistance) {
                    bestMinDistance = minDistance;
                    best = candidate;
                }
            }
            // best is never null here: the loop ran at least once over a non-empty pool.
            selected.add(best);
            pool.remove(best);
        }
        return selected;
    }

    /** Haversine distance in km; 0 when either hotel is missing coordinates (no spread signal). */
    private double distanceKm(HotelOption a, HotelOption b) {
        if (a.latitude() == null || a.longitude() == null || b.latitude() == null || b.longitude() == null) {
            return 0.0;
        }
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(b.latitude() - a.latitude());
        double dLon = Math.toRadians(b.longitude() - a.longitude());
        double lat1 = Math.toRadians(a.latitude());
        double lat2 = Math.toRadians(b.latitude());
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        return 2 * earthRadiusKm * Math.asin(Math.min(1.0, Math.sqrt(h)));
    }

    private List<RankedProposal> rankFallback(AgentContext ctx, List<HotelOption> hotels,
                                              List<RestaurantOption> restaurants, List<FlightOption> flights) {
        int persons = Math.max(1, ctx.adultsCount() + ctx.childrenCount());
        List<RankedProposal> proposals = new ArrayList<>();
        int rank = 100;

        outer:
        for (HotelOption hotel : hotels) {
            for (RestaurantOption restaurant : restaurants) {
                for (FlightOption flight : flights) {
                    BigDecimal total = tripTotal(hotel, restaurant, flight, persons);
                    if (total.compareTo(ctx.budget()) <= 0) {
                        proposals.add(buildProposal(ctx, hotel, restaurant, flight, total, rank--, hotel.city()));
                        if (proposals.size() >= MAX_PROPOSALS) {
                            break outer;
                        }
                    }
                }
            }
        }
        return proposals;
    }

    private BigDecimal tripTotal(HotelOption hotel, RestaurantOption restaurant, FlightOption flight, int persons) {
        BigDecimal people = BigDecimal.valueOf(persons);
        return hotel.totalCost()
                .add(restaurant.estimatedCostPerPerson().multiply(people))
                .add(flight.price().multiply(people));
    }

    private RankedProposal buildProposal(AgentContext ctx, HotelOption hotel, RestaurantOption restaurant,
                                         FlightOption flight, BigDecimal total, int rank, String city) {
        int persons = Math.max(1, ctx.adultsCount() + ctx.childrenCount());
        BigDecimal people = BigDecimal.valueOf(persons);
        BigDecimal restaurantCost = restaurant.estimatedCostPerPerson().multiply(people);
        BigDecimal flightCost = flight.price().multiply(people);
        String destination = city != null ? city : ctx.destination();
        String motivation = generateMotivation(ctx, hotel, restaurant, flight, destination);
        return new RankedProposal(
                hotel.hotelId(),
                restaurant.restaurantId(),
                flight.flightId(),
                total,
                hotel.totalCost(),
                restaurantCost,
                flightCost,
                rank,
                motivation,
                destination
        );
    }

    private FlightOption cheapestFlight(List<FlightOption> flights) {
        return flights.stream()
                .min(Comparator.comparing(FlightOption::price))
                .orElseThrow();
    }

    private String normalizeCity(String city) {
        return city.trim().toLowerCase(Locale.ROOT);
    }

    private String generateMotivation(AgentContext ctx, HotelOption hotel,
                                      RestaurantOption restaurant, FlightOption flight, String destination) {
        try {
            String prompt = String.format(
                    "Generate a short, enticing travel motivation (2-3 sentences) for a trip to %s. " +
                    "Hotel: %s (rating %.1f). Restaurant: %s cuisine. Flight: %s. Budget: €%.0f. " +
                    "Reply in Italian.",
                    destination != null ? destination : "Italy",
                    hotel.name(), hotel.rating(),
                    restaurant.cuisine(),
                    flight.airline(),
                    ctx.budget()
            );
            return chatClient.prompt(prompt).call().content();
        } catch (Exception e) {
            return "Un viaggio indimenticabile ti aspetta!";
        }
    }

    /** A budget-feasible hotel + restaurant pairing within a single city. */
    private record CityCandidate(String city, HotelOption hotel, RestaurantOption restaurant,
                                 FlightOption flight, BigDecimal total) {
    }
}
