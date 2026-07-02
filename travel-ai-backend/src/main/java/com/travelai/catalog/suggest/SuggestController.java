package com.travelai.catalog.suggest;

import com.travelai.catalog.suggest.dto.Suggestion;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Typeahead suggestions for catalog filter fields. Publicly readable
 * (covered by the {@code /api/catalog/**} permit-all rule).
 */
@RestController
@RequestMapping("/catalog/suggest")
@RequiredArgsConstructor
public class SuggestController {

    private final SuggestService suggestService;

    @GetMapping("/hotel-cities")
    public ApiResponse<List<Suggestion>> hotelCities(@RequestParam(defaultValue = "") String q) {
        return ApiResponse.ok(suggestService.hotelCities(q));
    }

    @GetMapping("/restaurant-cities")
    public ApiResponse<List<Suggestion>> restaurantCities(@RequestParam(defaultValue = "") String q) {
        return ApiResponse.ok(suggestService.restaurantCities(q));
    }

    @GetMapping("/cuisines")
    public ApiResponse<List<Suggestion>> cuisines(@RequestParam(defaultValue = "") String q) {
        return ApiResponse.ok(suggestService.cuisines(q));
    }

    @GetMapping("/cruise-ports")
    public ApiResponse<List<Suggestion>> cruisePorts(@RequestParam(defaultValue = "") String q) {
        return ApiResponse.ok(suggestService.cruisePorts(q));
    }

    @GetMapping("/cruise-types")
    public ApiResponse<List<Suggestion>> cruiseTypes(@RequestParam(defaultValue = "") String q) {
        return ApiResponse.ok(suggestService.cruiseTypes(q));
    }

    @GetMapping("/attraction-cities")
    public ApiResponse<List<Suggestion>> attractionCities(@RequestParam(defaultValue = "") String q) {
        return ApiResponse.ok(suggestService.attractionCities(q));
    }

    @GetMapping("/airports")
    public ApiResponse<List<Suggestion>> airports(@RequestParam(defaultValue = "") String q) {
        return ApiResponse.ok(suggestService.airports(q));
    }
}
