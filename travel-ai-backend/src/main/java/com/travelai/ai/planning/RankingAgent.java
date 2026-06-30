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

        // Highest-quality stays first, cheaper trips break ties — then one per distinct city.
        candidates.sort(Comparator.comparingDouble((CityCandidate c) -> c.hotel().rating()).reversed()
                .thenComparing(CityCandidate::total));

        List<RankedProposal> proposals = new ArrayList<>();
        int rank = 100;
        for (CityCandidate c : candidates) {
            if (proposals.size() >= MAX_PROPOSALS) {
                break;
            }
            proposals.add(buildProposal(ctx, c.hotel(), c.restaurant(), c.flight(), c.total(), rank--, c.city()));
        }
        return proposals;
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
