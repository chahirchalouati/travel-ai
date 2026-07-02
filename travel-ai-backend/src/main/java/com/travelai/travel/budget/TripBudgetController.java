package com.travelai.travel.budget;

import com.travelai.shared.domain.ApiResponse;
import com.travelai.travel.budget.dto.SetBudgetRequest;
import com.travelai.travel.budget.dto.TripBudgetSummaryResponse;
import com.travelai.travel.budget.dto.TripExpenseRequest;
import com.travelai.travel.budget.dto.TripExpenseResponse;
import com.travelai.travel.budget.dto.TripRefResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Trip budget & spending summary. All endpoints are authenticated (JWT) and
 * owner-scoped: the trip must belong to the current user.
 */
@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripBudgetController {

    private final TripBudgetService tripBudgetService;

    @GetMapping("/{tripId}/budget")
    public ApiResponse<TripBudgetSummaryResponse> getBudget(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId) {
        return ApiResponse.ok(tripBudgetService.getSummary(user.getUsername(), tripId));
    }

    @PutMapping("/{tripId}/budget")
    public ApiResponse<TripBudgetSummaryResponse> setBudget(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId,
            @RequestBody @Valid SetBudgetRequest req) {
        return ApiResponse.ok(tripBudgetService.setBudget(user.getUsername(), tripId, req.amount()));
    }

    @GetMapping("/{tripId}/expenses")
    public ApiResponse<List<TripExpenseResponse>> listExpenses(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId) {
        return ApiResponse.ok(tripBudgetService.listExpenses(user.getUsername(), tripId));
    }

    @PostMapping("/{tripId}/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TripExpenseResponse> addExpense(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId,
            @RequestBody @Valid TripExpenseRequest req) {
        return ApiResponse.ok(tripBudgetService.addExpense(user.getUsername(), tripId, req));
    }

    @DeleteMapping("/{tripId}/expenses/{expenseId}")
    public ApiResponse<Void> deleteExpense(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripId,
            @PathVariable UUID expenseId) {
        tripBudgetService.deleteExpense(user.getUsername(), tripId, expenseId);
        return ApiResponse.ok(null);
    }

    /** Resolves the trip behind a booking so booking-scoped pages can show the budget card. */
    @GetMapping("/for-booking/{bookingId}")
    public ApiResponse<TripRefResponse> tripForBooking(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID bookingId) {
        return ApiResponse.ok(tripBudgetService.resolveTripForBooking(user.getUsername(), bookingId));
    }
}
