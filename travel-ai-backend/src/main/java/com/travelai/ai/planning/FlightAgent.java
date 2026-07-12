package com.travelai.ai.planning;

import com.travelai.ai.planning.dto.AgentContext;
import com.travelai.ai.planning.dto.FlightOption;
import com.travelai.catalog.flight.FlightService;
import com.travelai.catalog.flight.dto.FlightSearchRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class FlightAgent {

    private final FlightService flightService;

    public List<FlightOption> findOptions(AgentContext ctx) {
        // Pass null for IATA codes — destination is a city name, not an IATA code.
        // FlightService will return any available flights when origin/dest are null.
        FlightSearchRequest req = new FlightSearchRequest(
                null,
                null,
                ctx.departureDate(),
                ctx.adultsCount() + ctx.childrenCount(),
                ctx.flightBudget()
        );
        return flightService.search(req).stream()
                .map(f -> new FlightOption(
                        f.id(),
                        f.airline(),
                        f.originIata(),
                        f.destIata(),
                        f.departureAt(),
                        f.arrivalAt(),
                        f.price(),
                        f.seatsAvailable()
                ))
                .limit(5)
                .toList();
    }
}
