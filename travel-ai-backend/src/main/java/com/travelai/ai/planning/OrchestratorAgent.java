package com.travelai.ai.planning;

import com.travelai.ai.planning.dto.AgentContext;
import com.travelai.ai.planning.dto.RankedProposal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OrchestratorAgent {

    private final HotelAgent hotelAgent;
    private final RestaurantAgent restaurantAgent;
    private final FlightAgent flightAgent;
    private final RankingAgent rankingAgent;

    public List<RankedProposal> orchestrate(AgentContext ctx) {
        var hotelOptions = hotelAgent.findOptions(ctx);
        var restaurantOptions = restaurantAgent.findOptions(ctx);
        var flightOptions = flightAgent.findOptions(ctx);
        return rankingAgent.rank(ctx, hotelOptions, restaurantOptions, flightOptions);
    }
}
