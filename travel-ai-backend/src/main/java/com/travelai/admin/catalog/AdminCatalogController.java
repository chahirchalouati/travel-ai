package com.travelai.admin.catalog;

import com.travelai.admin.catalog.dto.*;
import com.travelai.shared.domain.AdminListQuery;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/** Admin catalog management: create/update/delete + full listing of catalog content. */
@RestController
@RequestMapping("/admin/catalog")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCatalogController {

    private final AdminCatalogService service;

    private static <T> ApiResponse<Page<T>> paged(Page<T> page) {
        ApiResponse.Meta meta = new ApiResponse.Meta(page.getTotalElements(), page.getNumber(), page.getSize());
        return ApiResponse.ok(page, meta);
    }

    @GetMapping("/hotels")
    public ResponseEntity<ApiResponse<Page<AdminHotelDto.View>>> listHotels(
            Pageable pageable, @RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paged(service.listHotels(AdminListQuery.of(pageable, params))));
    }

    @PostMapping("/hotels")
    public ResponseEntity<ApiResponse<AdminHotelDto.View>> createHotel(@Valid @RequestBody AdminHotelDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.createHotel(req)));
    }

    @PutMapping("/hotels/{id}")
    public ResponseEntity<ApiResponse<AdminHotelDto.View>> updateHotel(
            @PathVariable UUID id, @Valid @RequestBody AdminHotelDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateHotel(id, req)));
    }

    @DeleteMapping("/hotels/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHotel(@PathVariable UUID id) {
        service.deleteHotel(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/flights")
    public ResponseEntity<ApiResponse<Page<AdminFlightDto.View>>> listFlights(
            Pageable pageable, @RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paged(service.listFlights(AdminListQuery.of(pageable, params))));
    }

    @PostMapping("/flights")
    public ResponseEntity<ApiResponse<AdminFlightDto.View>> createFlight(@Valid @RequestBody AdminFlightDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.createFlight(req)));
    }

    @PutMapping("/flights/{id}")
    public ResponseEntity<ApiResponse<AdminFlightDto.View>> updateFlight(
            @PathVariable UUID id, @Valid @RequestBody AdminFlightDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateFlight(id, req)));
    }

    @DeleteMapping("/flights/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFlight(@PathVariable UUID id) {
        service.deleteFlight(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/cruises")
    public ResponseEntity<ApiResponse<Page<AdminCruiseDto.View>>> listCruises(
            Pageable pageable, @RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paged(service.listCruises(AdminListQuery.of(pageable, params))));
    }

    @PostMapping("/cruises")
    public ResponseEntity<ApiResponse<AdminCruiseDto.View>> createCruise(@Valid @RequestBody AdminCruiseDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.createCruise(req)));
    }

    @PutMapping("/cruises/{id}")
    public ResponseEntity<ApiResponse<AdminCruiseDto.View>> updateCruise(
            @PathVariable UUID id, @Valid @RequestBody AdminCruiseDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateCruise(id, req)));
    }

    @DeleteMapping("/cruises/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCruise(@PathVariable UUID id) {
        service.deleteCruise(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/restaurants")
    public ResponseEntity<ApiResponse<Page<AdminRestaurantDto.View>>> listRestaurants(
            Pageable pageable, @RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paged(service.listRestaurants(AdminListQuery.of(pageable, params))));
    }

    @PostMapping("/restaurants")
    public ResponseEntity<ApiResponse<AdminRestaurantDto.View>> createRestaurant(
            @Valid @RequestBody AdminRestaurantDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.createRestaurant(req)));
    }

    @PutMapping("/restaurants/{id}")
    public ResponseEntity<ApiResponse<AdminRestaurantDto.View>> updateRestaurant(
            @PathVariable UUID id, @Valid @RequestBody AdminRestaurantDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateRestaurant(id, req)));
    }

    @DeleteMapping("/restaurants/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRestaurant(@PathVariable UUID id) {
        service.deleteRestaurant(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/destinations")
    public ResponseEntity<ApiResponse<Page<AdminDestinationDto.View>>> listDestinations(
            Pageable pageable, @RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paged(service.listDestinations(AdminListQuery.of(pageable, params))));
    }

    @PostMapping("/destinations")
    public ResponseEntity<ApiResponse<AdminDestinationDto.View>> createDestination(
            @Valid @RequestBody AdminDestinationDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.createDestination(req)));
    }

    @PutMapping("/destinations/{id}")
    public ResponseEntity<ApiResponse<AdminDestinationDto.View>> updateDestination(
            @PathVariable UUID id, @Valid @RequestBody AdminDestinationDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateDestination(id, req)));
    }

    @DeleteMapping("/destinations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDestination(@PathVariable UUID id) {
        service.deleteDestination(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/attractions")
    public ResponseEntity<ApiResponse<Page<AdminAttractionDto.View>>> listAttractions(
            Pageable pageable, @RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paged(service.listAttractions(AdminListQuery.of(pageable, params))));
    }

    @PostMapping("/attractions")
    public ResponseEntity<ApiResponse<AdminAttractionDto.View>> createAttraction(
            @Valid @RequestBody AdminAttractionDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.createAttraction(req)));
    }

    @PutMapping("/attractions/{id}")
    public ResponseEntity<ApiResponse<AdminAttractionDto.View>> updateAttraction(
            @PathVariable UUID id, @Valid @RequestBody AdminAttractionDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateAttraction(id, req)));
    }

    @DeleteMapping("/attractions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAttraction(@PathVariable UUID id) {
        service.deleteAttraction(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/stories")
    public ResponseEntity<ApiResponse<Page<AdminStoryDto.View>>> listStories(
            Pageable pageable, @RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paged(service.listStories(AdminListQuery.of(pageable, params))));
    }

    @PostMapping("/stories")
    public ResponseEntity<ApiResponse<AdminStoryDto.View>> createStory(@Valid @RequestBody AdminStoryDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.createStory(req)));
    }

    @PutMapping("/stories/{id}")
    public ResponseEntity<ApiResponse<AdminStoryDto.View>> updateStory(
            @PathVariable UUID id, @Valid @RequestBody AdminStoryDto.Upsert req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateStory(id, req)));
    }

    @DeleteMapping("/stories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStory(@PathVariable UUID id) {
        service.deleteStory(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
