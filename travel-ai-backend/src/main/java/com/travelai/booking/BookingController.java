package com.travelai.booking;

import com.travelai.booking.dto.*;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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

    @PatchMapping("/{id}/cancel")
    public ApiResponse<BookingResponse> cancel(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        return ApiResponse.ok(bookingService.cancelBooking(user.getUsername(), id));
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
