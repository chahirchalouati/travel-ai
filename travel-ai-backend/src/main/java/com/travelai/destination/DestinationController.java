package com.travelai.destination;

import com.travelai.destination.dto.ContinentSummary;
import com.travelai.destination.dto.DestinationGuide;
import com.travelai.destination.dto.DestinationResponse;
import com.travelai.destination.dto.InterestSummary;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DestinationResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<DestinationResponse> result = destinationService.getAll(page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<DestinationResponse>>> getFeatured() {
        List<DestinationResponse> result = destinationService.getFeatured();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<DestinationResponse>>> getTrending(
            @RequestParam(defaultValue = "10") int limit) {
        List<DestinationResponse> result = destinationService.getTrending(limit);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<DestinationResponse>>> search(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<DestinationResponse> result = destinationService.search(query, page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/continents")
    public ResponseEntity<ApiResponse<List<ContinentSummary>>> getContinents() {
        return ResponseEntity.ok(ApiResponse.ok(destinationService.getContinents()));
    }

    @GetMapping("/interests")
    public ResponseEntity<ApiResponse<List<InterestSummary>>> getInterests() {
        return ResponseEntity.ok(ApiResponse.ok(destinationService.getInterests()));
    }

    @GetMapping("/continent/{continent}")
    public ResponseEntity<ApiResponse<List<DestinationResponse>>> getByContinent(
            @PathVariable String continent) {
        List<DestinationResponse> result = destinationService.getByContinent(continent);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DestinationResponse>> getById(@PathVariable UUID id) {
        DestinationResponse result = destinationService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}/guide")
    public ResponseEntity<ApiResponse<DestinationGuide>> generateGuide(@PathVariable UUID id) {
        DestinationGuide result = destinationService.generateGuide(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
