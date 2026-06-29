package com.travelai.catalog.flight;

import com.travelai.catalog.flight.dto.FlightSearchRequest;
import com.travelai.catalog.flight.dto.FlightSearchResult;
import com.travelai.shared.domain.ApiResponse;
import com.travelai.shared.domain.PageSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return PageSupport.paginate(flightService.search(request), page, size);
    }

    @GetMapping("/{id}")
    public ApiResponse<FlightSearchResult> getById(@PathVariable UUID id) {
        return ApiResponse.ok(flightService.getById(id));
    }
}
