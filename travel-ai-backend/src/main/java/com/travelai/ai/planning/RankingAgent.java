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
import java.util.List;

@Component
@RequiredArgsConstructor
public class RankingAgent {

    private final ChatClient chatClient;

    public List<RankedProposal> rank(AgentContext ctx, List<HotelOption> hotels,
                                     List<RestaurantOption> restaurants, List<FlightOption> flights) {
        List<RankedProposal> proposals = new ArrayList<>();
        int rank = 100;

        outer:
        for (HotelOption hotel : hotels) {
            for (RestaurantOption restaurant : restaurants) {
                for (FlightOption flight : flights) {
                    BigDecimal total = hotel.totalCost()
                            .add(restaurant.estimatedCostPerPerson()
                                    .multiply(BigDecimal.valueOf(ctx.adultsCount() + ctx.childrenCount())))
                            .add(flight.price()
                                    .multiply(BigDecimal.valueOf(ctx.adultsCount() + ctx.childrenCount())));

                    if (total.compareTo(ctx.budget()) <= 0) {
                        String motivation = generateMotivation(ctx, hotel, restaurant, flight);
                        proposals.add(new RankedProposal(
                                hotel.hotelId(),
                                restaurant.restaurantId(),
                                flight.flightId(),
                                total,
                                rank--,
                                motivation
                        ));
                        if (proposals.size() >= 3) {
                            break outer;
                        }
                    }
                }
            }
        }

        return proposals;
    }

    private String generateMotivation(AgentContext ctx, HotelOption hotel,
                                      RestaurantOption restaurant, FlightOption flight) {
        try {
            String prompt = String.format(
                    "Generate a short, enticing travel motivation (2-3 sentences) for a trip to %s. " +
                    "Hotel: %s (rating %.1f). Restaurant: %s cuisine. Flight: %s. Budget: €%.0f. Language: Italian.",
                    ctx.destination() != null ? ctx.destination() : "Italy",
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
}
