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

    /**
     * Real-time SSE stream of proposal alerts. The browser {@code EventSource} cannot set an
     * Authorization header, so {@link com.travelai.auth.JwtAuthFilter} accepts the JWT as an
     * {@code access_token} query parameter for this endpoint only.
     *
     * <p>Trade-off: a token in the query string can leak into HTTP access logs. The embedded
     * server ships with access logging disabled, so nothing logs it by default. If access
     * logging is ever enabled (reverse proxy or {@code server.tomcat.accesslog}), the
     * {@code access_token} parameter MUST be masked in the log pattern.
     */
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
