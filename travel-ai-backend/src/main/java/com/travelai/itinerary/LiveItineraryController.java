package com.travelai.itinerary;

import com.travelai.itinerary.dto.ItineraryProposalResponse;
import com.travelai.itinerary.dto.LiveItineraryResponse;
import com.travelai.itinerary.dto.ReportEventRequest;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/itinerary")
@RequiredArgsConstructor
public class LiveItineraryController {

    private final LiveItineraryService liveItineraryService;
    private final ItineraryStreamService streamService;

    /** Real-time SSE stream of proposal alerts. Auth via access_token query param (EventSource). */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal UserDetails user) {
        return streamService.subscribe(user.getUsername());
    }

    @GetMapping("/booking/{bookingId}")
    public ApiResponse<LiveItineraryResponse> getByBooking(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID bookingId) {
        return ApiResponse.ok(liveItineraryService.getByBooking(user.getUsername(), bookingId));
    }

    @PostMapping("/{itineraryId}/events")
    public ApiResponse<Void> reportEvent(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID itineraryId,
            @RequestBody ReportEventRequest request) {
        liveItineraryService.recordManualEvent(user.getUsername(), itineraryId, request);
        return ApiResponse.ok(null);
    }

    @GetMapping("/{itineraryId}/proposals")
    public ApiResponse<List<ItineraryProposalResponse>> listProposals(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID itineraryId) {
        return ApiResponse.ok(liveItineraryService.listProposals(user.getUsername(), itineraryId));
    }

    @PostMapping("/proposals/{proposalId}/approve")
    public ApiResponse<Void> approve(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID proposalId) {
        liveItineraryService.approve(user.getUsername(), proposalId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/proposals/{proposalId}/reject")
    public ApiResponse<Void> reject(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID proposalId) {
        liveItineraryService.reject(user.getUsername(), proposalId);
        return ApiResponse.ok(null);
    }
}
