package com.travelai.ai.planning;

import com.travelai.ai.planning.dto.*;
import com.travelai.attraction.AttractionService;
import com.travelai.attraction.dto.AttractionResponse;
import com.travelai.attraction.dto.AttractionSearchRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ItineraryPlanService")
class ItineraryPlanServiceTest {

    @Mock private HotelAgent hotelAgent;
    @Mock private RestaurantAgent restaurantAgent;
    @Mock private FlightAgent flightAgent;
    @Mock private AttractionService attractionService;
    @Mock private AiBudgetSplitter budgetSplitter;

    @InjectMocks private ItineraryPlanService service;

    private static HotelOption hotel(String name, String price, double rating) {
        return new HotelOption(UUID.randomUUID(), name, "Rome",
                new BigDecimal(price), new BigDecimal(price), rating, null, null);
    }

    private static RestaurantOption restaurant(String name, String cost, double rating) {
        return new RestaurantOption(UUID.randomUUID(), name, "Rome", "Italian",
                new BigDecimal(cost), rating);
    }

    private static FlightOption flight(String airline, String price) {
        return new FlightOption(UUID.randomUUID(), airline, "MXP", "FCO",
                Instant.now(), Instant.now().plusSeconds(7200), new BigDecimal(price), 40);
    }

    private static AttractionResponse attraction(String name, String price) {
        return new AttractionResponse(UUID.randomUUID(), name, "Museum", "Rome", "IT",
                null, null, null, null, "MEDIUM", new BigDecimal(price), 120, true,
                List.of(), 50, false);
    }

    @Test
    @DisplayName("builds a grounded multi-day plan picking the top hotel and cheapest flight")
    void plan_happyPath() {
        when(hotelAgent.findOptions(any())).thenReturn(List.of(
                hotel("Budget Inn", "100", 4.5), hotel("Grand Hotel", "150", 4.8)));
        when(flightAgent.findOptions(any())).thenReturn(List.of(
                flight("Alitalia", "200"), flight("RyanAir", "120")));
        when(restaurantAgent.findOptions(any())).thenReturn(List.of(restaurant("Trattoria", "30", 4.0)));
        when(attractionService.search(any(AttractionSearchRequest.class))).thenReturn(List.of(
                attraction("Colosseum", "10"), attraction("Vatican", "20")));

        ItineraryPlanResponse res = service.plan(
                new ItineraryPlanRequest("Rome", 3, null, null, null, List.of("art")));

        // 3 days, 2 nights, party defaults to 2 adults
        assertThat(res.days()).isEqualTo(3);
        assertThat(res.nights()).isEqualTo(2);
        assertThat(res.party()).isEqualTo(2);
        // top-rated hotel, re-priced for 2 nights
        assertThat(res.hotel().name()).isEqualTo("Grand Hotel");
        assertThat(res.hotel().totalCost()).isEqualByComparingTo("300");
        // cheapest flight
        assertThat(res.flight().airline()).isEqualTo("RyanAir");
        // every day has a dinner and up to two activities
        assertThat(res.plan()).hasSize(3);
        assertThat(res.plan().get(0).activities()).hasSize(2);
        assertThat(res.plan().get(0).dinner()).isNotNull();
        // 300 hotel + 240 flight(120×2) + 180 dinners(30×2×3) + 180 activities((10+20)×3×2)
        assertThat(res.estimatedTotal()).isEqualByComparingTo("900.00");
    }

    @Test
    @DisplayName("clamps days and degrades gracefully when the catalogue is empty")
    void plan_emptyCatalogue() {
        when(hotelAgent.findOptions(any())).thenReturn(List.of());
        when(flightAgent.findOptions(any())).thenReturn(List.of());
        when(restaurantAgent.findOptions(any())).thenReturn(List.of());
        when(attractionService.search(any(AttractionSearchRequest.class))).thenReturn(List.of());

        ItineraryPlanResponse res = service.plan(
                new ItineraryPlanRequest("Nowhere", 999, null, null, null, null));

        assertThat(res.days()).isEqualTo(14); // clamped to MAX_DAYS
        assertThat(res.hotel()).isNull();
        assertThat(res.flight()).isNull();
        assertThat(res.plan()).hasSize(14);
        assertThat(res.plan().get(0).activities()).isEmpty();
        assertThat(res.plan().get(0).dinner()).isNull();
        assertThat(res.estimatedTotal()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("defaults to a 3-day plan when days is not given")
    void plan_defaultsDays() {
        when(hotelAgent.findOptions(any())).thenReturn(List.of());
        when(flightAgent.findOptions(any())).thenReturn(List.of());
        when(restaurantAgent.findOptions(any())).thenReturn(List.of());
        when(attractionService.search(any(AttractionSearchRequest.class))).thenReturn(List.of());

        ItineraryPlanResponse res = service.plan(
                new ItineraryPlanRequest("Paris", null, 3, 1, null, null));

        assertThat(res.days()).isEqualTo(3);
        assertThat(res.party()).isEqualTo(4); // 3 adults + 1 child
    }
}
