package com.travelai.catalog.cruise;

import com.travelai.catalog.cruise.dto.CruiseCabin;
import com.travelai.catalog.cruise.dto.CruiseDay;
import com.travelai.catalog.cruise.dto.CruiseSearchRequest;
import com.travelai.catalog.cruise.dto.CruiseSearchResult;
import com.travelai.shared.domain.ApiResponse;
import com.travelai.shared.domain.PageSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/catalog/cruises")
@RequiredArgsConstructor
public class CruiseController {

    private final CruiseService cruiseService;

    @GetMapping("/search")
    public ApiResponse<List<CruiseSearchResult>> search(
            @ModelAttribute CruiseSearchRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return PageSupport.paginate(cruiseService.search(request), page, size);
    }

    @GetMapping("/{id}")
    public ApiResponse<CruiseSearchResult> getById(@PathVariable UUID id) {
        return ApiResponse.ok(cruiseService.getById(id));
    }

    @GetMapping("/{id}/cabins")
    public ApiResponse<List<CruiseCabin>> cabins(@PathVariable UUID id) {
        return ApiResponse.ok(cruiseService.cabins(id));
    }

    @GetMapping("/{id}/itinerary")
    public ApiResponse<List<CruiseDay>> itinerary(@PathVariable UUID id) {
        return ApiResponse.ok(cruiseService.itinerary(id));
    }
}
