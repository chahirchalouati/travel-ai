package com.travelai.ai.planning;

import com.travelai.ai.planning.dto.AgentContext;
import com.travelai.ai.planning.dto.HotelOption;
import com.travelai.catalog.hotel.HotelService;
import com.travelai.catalog.hotel.dto.HotelSearchRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class HotelAgent {

    private final HotelService hotelService;

    public List<HotelOption> findOptions(AgentContext ctx) {
        HotelSearchRequest req = new HotelSearchRequest(
                ctx.destination(),
                ctx.departureDate(),
                ctx.returnDate(),
                ctx.adultsCount() + ctx.childrenCount(),
                ctx.hotelBudget(),
                ctx.constraints()
        );
        return hotelService.search(req).stream()
                .map(r -> new HotelOption(
                        r.id(),
                        r.name(),
                        r.city(),
                        r.pricePerNight(),
                        r.totalPrice(),
                        r.stars() != null ? r.stars().doubleValue() : 0.0
                ))
                .limit(60)
                .toList();
    }
}
