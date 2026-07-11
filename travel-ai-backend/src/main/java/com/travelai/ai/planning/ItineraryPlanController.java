package com.travelai.ai.planning;

import com.travelai.ai.planning.dto.ItineraryPlanRequest;
import com.travelai.ai.planning.dto.ItineraryPlanResponse;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Synchronous AI trip planner: a brief in, a grounded day-by-day itinerary out. */
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class ItineraryPlanController {

    private final ItineraryPlanService itineraryPlanService;

    @PostMapping("/itinerary-plan")
    public ApiResponse<ItineraryPlanResponse> plan(@RequestBody @Valid ItineraryPlanRequest request) {
        return ApiResponse.ok(itineraryPlanService.plan(request));
    }
}
