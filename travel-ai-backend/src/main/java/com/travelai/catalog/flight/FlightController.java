package com.travelai.catalog.flight;

import com.travelai.catalog.flight.dto.FlightSearchRequest;
import com.travelai.catalog.flight.dto.FlightSearchResult;
import com.travelai.shared.domain.ApiResponse;
import com.travelai.shared.domain.PageSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/catalog/flights")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;

    @GetMapping("/search")
    public ApiResponse<List<FlightSearchResult>> search(
            @ModelAttribute FlightSearchRequest request,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return PageSupport.paginate(flightService.search(request), comparatorFor(sort), page, size);
    }

    private static Comparator<FlightSearchResult> comparatorFor(String sort) {
        if (sort == null || sort.isBlank()) {
            return null;
        }
        return switch (sort) {
            case "price_asc" -> Comparator.comparing(FlightSearchResult::price,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case "price_desc" -> Comparator.comparing(FlightSearchResult::price,
                    Comparator.nullsLast(Comparator.reverseOrder()));
            case "departure_asc" -> Comparator.comparing(FlightSearchResult::departureAt,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case "departure_desc" -> Comparator.comparing(FlightSearchResult::departureAt,
                    Comparator.nullsLast(Comparator.reverseOrder()));
            default -> null;
        };
    }

    @GetMapping("/{id}")
    public ApiResponse<FlightSearchResult> getById(@PathVariable UUID id) {
        return ApiResponse.ok(flightService.getById(id));
    }
}
