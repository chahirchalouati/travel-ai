package com.travelai.catalog.hotel;

import com.travelai.catalog.hotel.dto.HotelSearchRequest;
import com.travelai.catalog.hotel.dto.HotelSearchResult;
import com.travelai.shared.domain.ApiResponse;
import com.travelai.shared.domain.PageSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/catalog/hotels")
@RequiredArgsConstructor
public class HotelController {

    private final HotelService hotelService;

    @GetMapping("/search")
    public ApiResponse<List<HotelSearchResult>> search(
            @ModelAttribute HotelSearchRequest request,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return PageSupport.paginate(hotelService.search(request), comparatorFor(sort), page, size);
    }

    private static Comparator<HotelSearchResult> comparatorFor(String sort) {
        if (sort == null || sort.isBlank()) {
            return null;
        }
        return switch (sort) {
            case "price_asc" -> Comparator.comparing(HotelSearchResult::pricePerNight,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case "price_desc" -> Comparator.comparing(HotelSearchResult::pricePerNight,
                    Comparator.nullsLast(Comparator.reverseOrder()));
            case "stars_desc" -> Comparator.comparing(HotelSearchResult::stars,
                    Comparator.nullsLast(Comparator.reverseOrder()));
            case "stars_asc" -> Comparator.comparing(HotelSearchResult::stars,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            default -> null;
        };
    }

    @GetMapping("/{id}")
    public ApiResponse<HotelSearchResult> getById(@PathVariable UUID id) {
        return ApiResponse.ok(hotelService.getById(id));
    }

    @GetMapping("/{id}/availability")
    public ApiResponse<Boolean> checkAvailability(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "1") int guests) {
        return ApiResponse.ok(hotelService.checkAvailability(id, from, to, guests));
    }
}
