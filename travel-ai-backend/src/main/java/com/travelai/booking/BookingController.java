package com.travelai.booking;

import com.travelai.booking.dto.*;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final BookingCancellationService cancellationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> create(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody @Valid CreateBookingRequest req) {
        return ApiResponse.ok(bookingService.createBooking(user.getUsername(), req));
    }

    @GetMapping
    public ApiResponse<Page<BookingResponse>> list(
            @AuthenticationPrincipal UserDetails user,
            Pageable pageable) {
        return ApiResponse.ok(bookingService.getMyBookings(user.getUsername(), pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<BookingResponse> get(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        return ApiResponse.ok(bookingService.getBooking(user.getUsername(), id));
    }

    @GetMapping(value = "/{id}/calendar.ics", produces = "text/calendar")
    public ResponseEntity<String> calendar(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        String ics = bookingService.icsForBooking(user.getUsername(), id);
        String reference = bookingService.getBooking(user.getUsername(), id).bookingReference();
        String filename = "booking-" + (reference != null ? reference : id) + ".ics";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(ics);
    }

    /** Refund quote for cancelling now — does not cancel anything. */
    @GetMapping("/{id}/cancellation-preview")
    public ApiResponse<CancellationPreviewResponse> cancellationPreview(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        return ApiResponse.ok(cancellationService.preview(user.getUsername(), id));
    }

    /** Self-service cancellation: refund per policy, inventory restored, email sent. */
    @PostMapping("/{id}/cancel")
    public ApiResponse<CancellationResultResponse> cancel(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id,
            @RequestBody(required = false) @Valid CancelBookingRequest req) {
        String reason = req != null ? req.reason() : null;
        return ApiResponse.ok(cancellationService.cancel(user.getUsername(), id, reason));
    }

    /** Legacy verb kept for older clients; same refund-aware flow as the POST. */
    @PatchMapping("/{id}/cancel")
    public ApiResponse<CancellationResultResponse> cancelLegacy(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        return ApiResponse.ok(cancellationService.cancel(user.getUsername(), id, null));
    }

    @PostMapping("/waitlist")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WaitlistEntryResponse> joinWaitlist(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody JoinWaitlistRequest req) {
        return ApiResponse.ok(bookingService.joinWaitlist(user.getUsername(), req));
    }

    @GetMapping("/waitlist")
    public ApiResponse<List<WaitlistEntryResponse>> myWaitlist(
            @AuthenticationPrincipal UserDetails user) {
        return ApiResponse.ok(bookingService.getMyWaitlist(user.getUsername()));
    }
}
