package com.travelai.itinerary;

import com.travelai.itinerary.dto.TripMapResponse;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Map view of a trip: the live itinerary's stops resolved to coordinates,
 * ordered day by day. Authenticated; the booking must belong to the caller.
 */
@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripMapController {

    private final TripMapService tripMapService;

    @GetMapping("/{bookingId}/map")
    public ApiResponse<TripMapResponse> getTripMap(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID bookingId) {
        return ApiResponse.ok(tripMapService.getTripMap(user.getUsername(), bookingId));
    }
}
