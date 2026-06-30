package com.travelai.catalog.restaurant;

import com.travelai.catalog.restaurant.dto.RestaurantSearchRequest;
import com.travelai.catalog.restaurant.dto.RestaurantSearchResult;
import com.travelai.shared.domain.ApiResponse;
import com.travelai.shared.domain.PageSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/catalog/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    @GetMapping("/search")
    public ApiResponse<List<RestaurantSearchResult>> search(
            @ModelAttribute RestaurantSearchRequest request,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return PageSupport.paginate(restaurantService.search(request), comparatorFor(sort), page, size);
    }

    private static Comparator<RestaurantSearchResult> comparatorFor(String sort) {
        if (sort == null || sort.isBlank()) {
            return null;
        }
        return switch (sort) {
            case "price_asc" -> Comparator.comparing(RestaurantSearchResult::priceTier,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case "price_desc" -> Comparator.comparing(RestaurantSearchResult::priceTier,
                    Comparator.nullsLast(Comparator.reverseOrder()));
            case "name_asc" -> Comparator.comparing(RestaurantSearchResult::name,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            default -> null;
        };
    }

    @GetMapping("/{id}")
    public ApiResponse<RestaurantSearchResult> getById(@PathVariable UUID id) {
        return ApiResponse.ok(restaurantService.getById(id));
    }
}
