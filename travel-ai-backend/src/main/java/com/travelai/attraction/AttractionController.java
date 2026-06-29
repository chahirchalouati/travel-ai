package com.travelai.attraction;

import com.travelai.attraction.dto.AttractionResponse;
import com.travelai.attraction.dto.AttractionSearchRequest;
import com.travelai.shared.domain.ApiResponse;
import com.travelai.shared.domain.PageSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/attractions")
@RequiredArgsConstructor
public class AttractionController {

    private final AttractionService attractionService;

    @GetMapping("/search")
    public ApiResponse<List<AttractionResponse>> search(
            @ModelAttribute AttractionSearchRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return PageSupport.paginate(attractionService.search(request), page, size);
    }

    @GetMapping("/featured")
    public ApiResponse<List<AttractionResponse>> featured() {
        return ApiResponse.ok(attractionService.getFeatured());
    }

    @GetMapping("/trending")
    public ApiResponse<List<AttractionResponse>> trending(
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(attractionService.getTrending(limit));
    }

    @GetMapping("/categories")
    public ApiResponse<List<String>> categories() {
        return ApiResponse.ok(attractionService.getCategories());
    }

    @GetMapping("/{id}")
    public ApiResponse<AttractionResponse> getById(@PathVariable UUID id) {
        return ApiResponse.ok(attractionService.getById(id));
    }
}
