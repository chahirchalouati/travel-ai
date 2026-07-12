package com.travelai.ai.planning;

import com.travelai.ai.planning.dto.*;
import com.travelai.ai.planning.dto.ItineraryPlanResponse.*;
import com.travelai.attraction.AttractionService;
import com.travelai.attraction.dto.AttractionResponse;
import com.travelai.attraction.dto.AttractionSearchRequest;
import com.travelai.shared.domain.SpendingPriority;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Builds a structured, day-by-day trip itinerary from a lightweight brief. The
 * picks are grounded in the real catalogue (via the planning agents and the
 * attraction service), never invented; the per-day narrative is templated from
 * those real picks so the plan is deterministic and always renders. A richer
 * LLM narrative is layered on in the conversational phase.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ItineraryPlanService {

    private static final int DEFAULT_DAYS = 3;
    private static final int MAX_DAYS = 14;
    private static final int DEFAULT_ADULTS = 2;
    /** Plan trips starting a fortnight out, so catalogue availability is realistic. */
    private static final int LEAD_DAYS = 14;
    private static final int MAX_ACTIVITIES_PER_DAY = 2;

    private final HotelAgent hotelAgent;
    private final RestaurantAgent restaurantAgent;
    private final FlightAgent flightAgent;
    private final AttractionService attractionService;
    private final AiBudgetSplitter budgetSplitter;
    private final ChatClient chatClient;

    public ItineraryPlanResponse plan(ItineraryPlanRequest request) {
        int days = clamp(request.days() != null ? request.days() : DEFAULT_DAYS, 1, MAX_DAYS);
        int nights = Math.max(1, days - 1);
        int adults = request.adults() != null && request.adults() > 0 ? request.adults() : DEFAULT_ADULTS;
        int children = request.children() != null && request.children() > 0 ? request.children() : 0;
        int party = adults + children;
        String destination = request.destination().trim();

        LocalDate departure = LocalDate.now().plusDays(LEAD_DAYS);
        LocalDate returnDate = departure.plusDays(nights);

        BigDecimal[] budgets = splitBudget(request.budget());
        AgentContext ctx = new AgentContext(
                UUID.randomUUID(), destination, departure, returnDate,
                adults, children, request.budget(),
                budgets[0], budgets[1], budgets[2],
                SpendingPriority.BALANCED, request.interests());

        PlannedHotel hotel = pickHotel(ctx, nights);
        PlannedFlight flight = pickFlight(ctx);
        List<PlannedRestaurant> restaurants = restaurantAgent.findOptions(ctx).stream()
                .sorted(Comparator.comparingDouble(RestaurantOption::rating).reversed())
                .map(r -> new PlannedRestaurant(r.restaurantId(), r.name(), r.cuisine(),
                        r.estimatedCostPerPerson(), r.rating()))
                .toList();
        List<PlannedActivity> activities = attractionService
                .search(new AttractionSearchRequest(destination, null, null, null)).stream()
                .map(this::toActivity)
                .toList();

        List<PlannedDay> plan = buildDays(days, destination, activities, restaurants);
        BigDecimal total = estimateTotal(hotel, flight, plan, party);
        String summary = enrichSummary(destination, days, party, hotel,
                summarise(destination, days, party, hotel));

        return new ItineraryPlanResponse(
                destination, days, nights, party, hotel, flight, plan, total, "EUR", summary);
    }

    /** Best hotel: highest rated first, re-priced for the actual number of nights. */
    private PlannedHotel pickHotel(AgentContext ctx, int nights) {
        return hotelAgent.findOptions(ctx).stream()
                .max(Comparator.comparingDouble(HotelOption::rating)
                        .thenComparing(h -> h.pricePerNight() == null ? BigDecimal.ZERO : h.pricePerNight(),
                                Comparator.reverseOrder()))
                .map(h -> new PlannedHotel(h.hotelId(), h.name(), h.city(),
                        h.pricePerNight(),
                        h.pricePerNight() != null
                                ? h.pricePerNight().multiply(BigDecimal.valueOf(nights))
                                : h.totalCost(),
                        h.rating()))
                .orElse(null);
    }

    /** Cheapest available outbound flight, or none when the catalogue has no match. */
    private PlannedFlight pickFlight(AgentContext ctx) {
        return flightAgent.findOptions(ctx).stream()
                .min(Comparator.comparing(FlightOption::price))
                .map(f -> new PlannedFlight(f.flightId(), f.airline(), f.origin(), f.destination(),
                        f.departure() != null ? f.departure().atZone(ZoneOffset.UTC).toLocalDate().toString() : null,
                        f.arrival() != null ? f.arrival().atZone(ZoneOffset.UTC).toLocalDate().toString() : null,
                        f.price()))
                .orElse(null);
    }

    /** Distributes attractions (1–2/day) and dinners (1/day) round-robin across the days. */
    private List<PlannedDay> buildDays(int days, String destination,
                                       List<PlannedActivity> activities,
                                       List<PlannedRestaurant> restaurants) {
        List<PlannedDay> plan = new ArrayList<>();
        int actCursor = 0;
        for (int day = 1; day <= days; day++) {
            List<PlannedActivity> dayActivities = new ArrayList<>();
            for (int k = 0; k < MAX_ACTIVITIES_PER_DAY && !activities.isEmpty(); k++) {
                dayActivities.add(activities.get(actCursor % activities.size()));
                actCursor++;
            }
            PlannedRestaurant dinner = restaurants.isEmpty()
                    ? null
                    : restaurants.get((day - 1) % restaurants.size());
            plan.add(new PlannedDay(day, dayTitle(day, days, destination),
                    narrate(day, destination, dayActivities, dinner), dayActivities, dinner));
        }
        return plan;
    }

    private PlannedActivity toActivity(AttractionResponse a) {
        return new PlannedActivity(a.id(), a.name(), a.category(),
                a.basePrice() != null ? a.basePrice() : BigDecimal.ZERO, a.bookable());
    }

    private String dayTitle(int day, int days, String destination) {
        if (day == 1) {
            return "Arrival in " + destination;
        }
        if (day == days) {
            return "Last day in " + destination;
        }
        return "Day " + day + " in " + destination;
    }

    private String narrate(int day, String destination,
                           List<PlannedActivity> activities, PlannedRestaurant dinner) {
        StringBuilder sb = new StringBuilder();
        if (day == 1) {
            sb.append("Settle into ").append(destination).append(". ");
        }
        if (!activities.isEmpty()) {
            sb.append("Explore ");
            sb.append(String.join(" and ", activities.stream().map(PlannedActivity::name).toList()));
            sb.append(". ");
        }
        if (dinner != null) {
            sb.append("Dinner at ").append(dinner.name());
            if (dinner.cuisine() != null && !dinner.cuisine().isBlank()) {
                sb.append(" (").append(dinner.cuisine()).append(')');
            }
            sb.append('.');
        }
        return sb.toString().trim();
    }

    private BigDecimal estimateTotal(PlannedHotel hotel, PlannedFlight flight,
                                     List<PlannedDay> plan, int party) {
        BigDecimal total = BigDecimal.ZERO;
        if (hotel != null && hotel.totalCost() != null) {
            total = total.add(hotel.totalCost());
        }
        if (flight != null && flight.price() != null) {
            total = total.add(flight.price().multiply(BigDecimal.valueOf(party)));
        }
        BigDecimal partyMultiplier = BigDecimal.valueOf(party);
        for (PlannedDay day : plan) {
            if (day.dinner() != null && day.dinner().costPerPerson() != null) {
                total = total.add(day.dinner().costPerPerson().multiply(partyMultiplier));
            }
            for (PlannedActivity a : day.activities()) {
                if (a.price() != null) {
                    total = total.add(a.price().multiply(partyMultiplier));
                }
            }
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private String summarise(String destination, int days, int party, PlannedHotel hotel) {
        String stay = hotel != null ? " staying at " + hotel.name() : "";
        return "A " + days + "-day trip to " + destination + " for " + party
                + (party == 1 ? " traveller" : " travellers") + stay + ".";
    }

    /**
     * Asks the LLM for a warm one-paragraph summary of the (real) picks. Purely
     * cosmetic: any failure or empty answer falls back to the templated summary,
     * so the planner never depends on the model being available.
     */
    private String enrichSummary(String destination, int days, int party,
                                 PlannedHotel hotel, String fallback) {
        if (chatClient == null) {
            return fallback;
        }
        try {
            String prompt = ("Write a warm, concise 2-sentence summary (max 45 words) for a "
                    + days + "-day trip to " + destination + " for " + party + " traveller(s)"
                    + (hotel != null ? ", staying at " + hotel.name() : "")
                    + ". Reply in the same language as the destination's country if obvious, "
                    + "otherwise in English. Plain text only, no markdown.").trim();
            String reply = chatClient.prompt(prompt).call().content();
            return reply != null && !reply.isBlank() ? reply.trim() : fallback;
        } catch (Exception e) {
            log.debug("Itinerary summary enrichment failed, using template: {}", e.getMessage());
            return fallback;
        }
    }

    private BigDecimal[] splitBudget(BigDecimal budget) {
        if (budget == null || budget.signum() <= 0) {
            return new BigDecimal[]{null, null, null};
        }
        return budgetSplitter.split(budget, SpendingPriority.BALANCED);
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
