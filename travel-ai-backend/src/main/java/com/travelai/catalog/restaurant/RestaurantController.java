package com.travelai.catalog.restaurant;

import com.travelai.catalog.restaurant.dto.RestaurantSearchRequest;
import com.travelai.catalog.restaurant.dto.RestaurantSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/catalog/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    @GetMapping("/search")
    public List<RestaurantSearchResult> search(@ModelAttribute RestaurantSearchRequest request) {
        return restaurantService.search(request);
    }

    @GetMapping("/{id}")
    public RestaurantSearchResult getById(@PathVariable UUID id) {
        return restaurantService.getById(id);
    }
}
