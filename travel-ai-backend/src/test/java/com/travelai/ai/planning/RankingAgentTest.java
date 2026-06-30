package com.travelai.ai.planning;

import com.travelai.ai.planning.dto.AgentContext;
import com.travelai.ai.planning.dto.FlightOption;
import com.travelai.ai.planning.dto.HotelOption;
import com.travelai.ai.planning.dto.RankedProposal;
import com.travelai.ai.planning.dto.RestaurantOption;
import com.travelai.shared.domain.SpendingPriority;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class RankingAgentTest {

    // ChatClient is only used for the (best-effort) AI motivation; an unstubbed mock makes
    // generateMotivation fall back to its default text, which is irrelevant to ranking logic.
    private final RankingAgent rankingAgent = new RankingAgent(mock(ChatClient.class));

    private static final UUID HOTEL_ROME = UUID.randomUUID();
    private static final UUID HOTEL_PARIS = UUID.randomUUID();
    private static final UUID REST_ROME = UUID.randomUUID();
    private static final UUID REST_PARIS = UUID.randomUUID();
    private static final UUID FLIGHT = UUID.randomUUID();

    private AgentContext ctx(BigDecimal budget) {
        return new AgentContext(
                UUID.randomUUID(), null,
                LocalDate.now().plusDays(30), LocalDate.now().plusDays(35),
                2, 0,
                budget, budget, budget, budget,
                SpendingPriority.BALANCED, List.of());
    }

    private HotelOption hotel(UUID id, String city, double total, double rating) {
        double[] c = coords(city);
        return new HotelOption(id, "Hotel " + city, city, BigDecimal.valueOf(total / 5),
                BigDecimal.valueOf(total), rating, c[0], c[1]);
    }

    private double[] coords(String city) {
        return switch (city) {
            case "Rome" -> new double[]{41.9028, 12.4964};
            case "Milan" -> new double[]{45.4642, 9.1900};
            case "Florence" -> new double[]{43.7696, 11.2558};
            case "Paris" -> new double[]{48.8566, 2.3522};
            case "Tokyo" -> new double[]{35.6762, 139.6503};
            default -> new double[]{0.0, 0.0};
        };
    }

    private RestaurantOption restaurant(UUID id, String city, double perPerson) {
        return new RestaurantOption(id, "Ristorante " + city, city, "Local", BigDecimal.valueOf(perPerson), 4.0);
    }

    private FlightOption flight(double price) {
        return new FlightOption(FLIGHT, "ITA", "FCO", "CDG", Instant.now(), Instant.now().plusSeconds(7200),
                BigDecimal.valueOf(price), 50);
    }

    @Test
    @DisplayName("pairs each proposal's hotel and restaurant from the same city")
    void pairsHotelAndRestaurantFromSameCity() {
        List<HotelOption> hotels = List.of(hotel(HOTEL_ROME, "Rome", 500, 4.5), hotel(HOTEL_PARIS, "Paris", 600, 4.8));
        List<RestaurantOption> restaurants = List.of(restaurant(REST_ROME, "Rome", 50), restaurant(REST_PARIS, "Paris", 60));

        List<RankedProposal> proposals = rankingAgent.rank(ctx(BigDecimal.valueOf(5000)), hotels, restaurants, List.of(flight(100)));

        assertThat(proposals).hasSize(2);
        // Higher-rated city (Paris, 4.8) ranks first.
        assertThat(proposals.get(0).destination()).isEqualTo("Paris");
        assertThat(proposals.get(0).hotelId()).isEqualTo(HOTEL_PARIS);
        assertThat(proposals.get(0).restaurantId()).isEqualTo(REST_PARIS);
        assertThat(proposals.get(1).destination()).isEqualTo("Rome");
        assertThat(proposals.get(1).hotelId()).isEqualTo(HOTEL_ROME);
        assertThat(proposals.get(1).restaurantId()).isEqualTo(REST_ROME);
    }

    @Test
    @DisplayName("produces one proposal per distinct city")
    void producesDistinctCities() {
        List<HotelOption> hotels = List.of(
                hotel(UUID.randomUUID(), "Rome", 500, 4.9),
                hotel(UUID.randomUUID(), "Rome", 450, 4.2),
                hotel(HOTEL_PARIS, "Paris", 600, 4.8));
        List<RestaurantOption> restaurants = List.of(
                restaurant(REST_ROME, "Rome", 50),
                restaurant(REST_PARIS, "Paris", 60));

        List<RankedProposal> proposals = rankingAgent.rank(ctx(BigDecimal.valueOf(5000)), hotels, restaurants, List.of(flight(100)));

        assertThat(proposals).extracting(RankedProposal::destination).containsExactlyInAnyOrder("Rome", "Paris");
    }

    @Test
    @DisplayName("spreads proposals across distant cities instead of clustering nearby ones")
    void diversifiesAcrossDistantCities() {
        List<HotelOption> hotels = List.of(
                hotel(UUID.randomUUID(), "Rome", 500, 4.9),
                hotel(UUID.randomUUID(), "Milan", 500, 4.8),
                hotel(UUID.randomUUID(), "Florence", 500, 4.7),
                hotel(UUID.randomUUID(), "Tokyo", 500, 4.0));
        List<RestaurantOption> restaurants = List.of(
                restaurant(UUID.randomUUID(), "Rome", 50),
                restaurant(UUID.randomUUID(), "Milan", 50),
                restaurant(UUID.randomUUID(), "Florence", 50),
                restaurant(UUID.randomUUID(), "Tokyo", 50));

        List<RankedProposal> proposals = rankingAgent.rank(ctx(BigDecimal.valueOf(5000)), hotels, restaurants, List.of(flight(100)));

        assertThat(proposals).hasSize(3);
        // Tokyo (far) is surfaced over a third nearby Italian city despite its lower rating.
        assertThat(proposals).extracting(RankedProposal::destination).contains("Tokyo");
    }

    @Test
    @DisplayName("falls back to cross-city pairing when no single city has both hotel and restaurant")
    void fallsBackWhenNoCityHasBoth() {
        List<HotelOption> hotels = List.of(hotel(HOTEL_ROME, "Rome", 500, 4.5));
        List<RestaurantOption> restaurants = List.of(restaurant(REST_PARIS, "Paris", 60));

        List<RankedProposal> proposals = rankingAgent.rank(ctx(BigDecimal.valueOf(5000)), hotels, restaurants, List.of(flight(100)));

        assertThat(proposals).hasSize(1);
        assertThat(proposals.get(0).hotelId()).isEqualTo(HOTEL_ROME);
        assertThat(proposals.get(0).restaurantId()).isEqualTo(REST_PARIS);
    }

    @Test
    @DisplayName("returns no proposals when there are no flights")
    void returnsEmptyWithoutFlights() {
        List<HotelOption> hotels = List.of(hotel(HOTEL_ROME, "Rome", 500, 4.5));
        List<RestaurantOption> restaurants = List.of(restaurant(REST_ROME, "Rome", 50));

        List<RankedProposal> proposals = rankingAgent.rank(ctx(BigDecimal.valueOf(5000)), hotels, restaurants, List.of());

        assertThat(proposals).isEmpty();
    }

    @Test
    @DisplayName("excludes cities whose cheapest trip exceeds the budget")
    void excludesOverBudgetCities() {
        List<HotelOption> hotels = List.of(hotel(HOTEL_ROME, "Rome", 5000, 4.5));
        List<RestaurantOption> restaurants = List.of(restaurant(REST_ROME, "Rome", 50));

        // Budget far below the Rome hotel total -> no coherent candidate, and fallback also filters by budget.
        List<RankedProposal> proposals = rankingAgent.rank(ctx(BigDecimal.valueOf(400)), hotels, restaurants, List.of(flight(100)));

        assertThat(proposals).isEmpty();
    }
}
