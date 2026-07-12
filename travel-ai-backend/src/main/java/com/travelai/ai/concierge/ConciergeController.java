package com.travelai.ai.concierge;

import com.travelai.ai.concierge.dto.ConciergeRecommendation;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/ai/concierge")
@RequiredArgsConstructor
public class ConciergeController {

    private final ConciergeService conciergeService;

    @GetMapping("/recommendations")
    public ApiResponse<List<ConciergeRecommendation>> getRecommendations(
            @AuthenticationPrincipal UserDetails user) {
        return ApiResponse.ok(conciergeService.getRecommendationsForUser(user.getUsername()));
    }

    @GetMapping("/recommendations/{bookingId}")
    public ApiResponse<ConciergeRecommendation> getRecommendation(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID bookingId) {
        return ApiResponse.ok(conciergeService.getRecommendationForBooking(user.getUsername(), bookingId));
    }
}
