package com.travelai.catalog.hotel;

import com.travelai.catalog.hotel.dto.HotelSearchRequest;
import com.travelai.catalog.hotel.dto.HotelSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/catalog/hotels")
@RequiredArgsConstructor
public class HotelController {

    private final HotelService hotelService;

    @GetMapping("/search")
    public List<HotelSearchResult> search(@ModelAttribute HotelSearchRequest request) {
        return hotelService.search(request);
    }

    @GetMapping("/{id}")
    public HotelSearchResult getById(@PathVariable UUID id) {
        return hotelService.getById(id);
    }

    @GetMapping("/{id}/availability")
    public Boolean checkAvailability(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "1") int guests) {
        return hotelService.checkAvailability(id, from, to, guests);
    }
}
