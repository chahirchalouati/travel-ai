package com.travelai.ai.planning;

import com.travelai.ai.planning.dto.AgentContext;
import com.travelai.ai.planning.dto.RestaurantOption;
import com.travelai.catalog.restaurant.RestaurantService;
import com.travelai.catalog.restaurant.dto.RestaurantSearchRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class RestaurantAgent {

    private final RestaurantService restaurantService;

    public List<RestaurantOption> findOptions(AgentContext ctx) {
        RestaurantSearchRequest req = new RestaurantSearchRequest(
                ctx.destination(),
                ctx.departureDate(),
                null,
                ctx.adultsCount() + ctx.childrenCount(),
                ctx.restaurantBudget(),
                null
        );
        return restaurantService.search(req).stream()
                .map(r -> new RestaurantOption(
                        r.id(),
                        r.name(),
                        r.city(),
                        r.cuisineType(),
                        ctx.restaurantBudget() != null
                                ? ctx.restaurantBudget().divide(BigDecimal.valueOf(Math.max(1, ctx.adultsCount() + ctx.childrenCount())), 2, java.math.RoundingMode.HALF_UP)
                                : BigDecimal.ZERO,
                        r.priceTier() != null ? r.priceTier().doubleValue() : 0.0
                ))
                .limit(60)
                .toList();
    }
}
