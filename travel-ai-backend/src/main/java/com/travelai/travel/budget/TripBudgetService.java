package com.travelai.travel.budget;

import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.booking.BookingStatus;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import com.travelai.travel.TravelProposal;
import com.travelai.travel.TravelProposalRepository;
import com.travelai.travel.TravelRequest;
import com.travelai.travel.TravelRequestRepository;
import com.travelai.travel.budget.dto.TripBudgetSummaryResponse;
import com.travelai.travel.budget.dto.TripBudgetSummaryResponse.CategorySpend;
import com.travelai.travel.budget.dto.TripExpenseRequest;
import com.travelai.travel.budget.dto.TripExpenseResponse;
import com.travelai.travel.budget.dto.TripRefResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Trip budget vs. actual spend. Booked spend is aggregated from the user's
 * non-cancelled bookings linked to the trip either through the selected
 * proposal (booking.proposal_id -> travel_proposals.request_id) or, for
 * standalone funnel bookings, by date overlap with the trip's date range.
 * Manual out-of-pocket expenses (trip_expense) are merged on top.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class TripBudgetService {

    /** Booking vertical category codes used in the breakdown. */
    static final String CATEGORY_FLIGHTS = "VOLI";
    static final String CATEGORY_HOTELS = "HOTEL";
    static final String CATEGORY_RESTAURANTS = "RISTORANTI";
    static final String CATEGORY_CRUISES = "CROCIERE";
    static final String CATEGORY_ATTRACTIONS = "ATTRAZIONI";

    private static final int PERCENT_SCALE = 1;

    private final TravelRequestRepository requestRepository;
    private final TravelProposalRepository proposalRepository;
    private final BookingRepository bookingRepository;
    private final TripExpenseRepository expenseRepository;

    public TripBudgetSummaryResponse setBudget(String email, UUID tripId, BigDecimal amount) {
        TravelRequest trip = ownedTrip(email, tripId);
        trip.setBudgetAmount(amount);
        if (trip.getBudgetCurrency() == null) {
            trip.setBudgetCurrency("EUR");
        }
        requestRepository.save(trip);
        return summarize(trip);
    }

    @Transactional(readOnly = true)
    public TripBudgetSummaryResponse getSummary(String email, UUID tripId) {
        return summarize(ownedTrip(email, tripId));
    }

    @Transactional(readOnly = true)
    public List<TripExpenseResponse> listExpenses(String email, UUID tripId) {
        ownedTrip(email, tripId);
        return expenseRepository.findByTripIdOrderByCreatedAtDesc(tripId)
                .stream().map(TripExpenseResponse::from).toList();
    }

    public TripExpenseResponse addExpense(String email, UUID tripId, TripExpenseRequest req) {
        TravelRequest trip = ownedTrip(email, tripId);
        TripExpense expense = new TripExpense();
        expense.setTripId(trip.getId());
        expense.setUserId(trip.getUser().getId());
        expense.setCategory(req.category());
        expense.setDescription(req.description());
        expense.setAmount(req.amount());
        expense.setSpentOn(req.spentOn() != null ? req.spentOn() : LocalDate.now());
        return TripExpenseResponse.from(expenseRepository.save(expense));
    }

    public void deleteExpense(String email, UUID tripId, UUID expenseId) {
        ownedTrip(email, tripId);
        TripExpense expense = expenseRepository.findByIdAndTripId(expenseId, tripId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.EXPENSE_NOT_FOUND));
        expenseRepository.delete(expense);
    }

    /**
     * Resolves the trip a booking belongs to: first via its proposal, then by
     * date overlap with the user's active travel requests (most recent wins).
     */
    @Transactional(readOnly = true)
    public TripRefResponse resolveTripForBooking(String email, UUID bookingId) {
        Booking booking = bookingRepository.findByIdAndUserEmail(bookingId, email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));

        if (booking.getProposalId() != null) {
            TravelRequest viaProposal = proposalRepository.findById(booking.getProposalId())
                    .map(TravelProposal::getRequest)
                    .filter(r -> r != null && r.getUser() != null && email.equals(r.getUser().getEmail()))
                    .orElse(null);
            if (viaProposal != null) {
                return new TripRefResponse(viaProposal.getId(), viaProposal.getDestination());
            }
        }

        return requestRepository.findByUserEmailAndActiveTrue(email, Pageable.unpaged()).getContent()
                .stream()
                .filter(trip -> overlapsTripDates(trip, booking))
                .max(Comparator.comparing(TravelRequest::getCreatedAt,
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .map(trip -> new TripRefResponse(trip.getId(), trip.getDestination()))
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.REQUEST_NOT_FOUND));
    }

    private TripBudgetSummaryResponse summarize(TravelRequest trip) {
        Map<String, Slice> slices = new LinkedHashMap<>();

        for (Booking booking : tripBookings(trip)) {
            accumulateBooking(slices, booking);
        }
        for (TripExpense expense : expenseRepository.findByTripIdOrderByCreatedAtDesc(trip.getId())) {
            accumulate(slices, expense.getCategory().name(), expense.getAmount());
        }

        BigDecimal totalSpent = slices.values().stream()
                .map(s -> s.amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal budget = trip.getBudgetAmount();
        BigDecimal remaining = budget != null ? budget.subtract(totalSpent) : null;
        Double percentUsed = percentUsed(budget, totalSpent);
        String currency = trip.getBudgetCurrency() != null ? trip.getBudgetCurrency() : "EUR";

        List<CategorySpend> breakdown = slices.entrySet().stream()
                .map(e -> new CategorySpend(e.getKey(), e.getValue().amount, e.getValue().count))
                .sorted(Comparator.comparing(CategorySpend::amount).reversed())
                .toList();

        return new TripBudgetSummaryResponse(budget, currency, totalSpent, remaining, percentUsed, breakdown);
    }

    /** Non-cancelled bookings of the trip owner linked to this trip. */
    private List<Booking> tripBookings(TravelRequest trip) {
        UUID userId = trip.getUser() != null ? trip.getUser().getId() : null;
        if (userId == null) {
            return List.of();
        }
        Set<UUID> tripProposalIds = proposalRepository.findByRequestIdOrderByRankScoreDesc(trip.getId())
                .stream().map(TravelProposal::getId).collect(Collectors.toSet());

        return bookingRepository.findByUserId(userId).stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .filter(b -> isLinkedToTrip(trip, tripProposalIds, b))
                .toList();
    }

    private static boolean isLinkedToTrip(TravelRequest trip, Set<UUID> tripProposalIds, Booking booking) {
        if (booking.getProposalId() != null && tripProposalIds.contains(booking.getProposalId())) {
            return true;
        }
        return overlapsTripDates(trip, booking);
    }

    private static boolean overlapsTripDates(TravelRequest trip, Booking booking) {
        if (trip.getDepartureDate() == null || trip.getReturnDate() == null || booking.getCheckIn() == null) {
            return false;
        }
        LocalDate bookingEnd = booking.getCheckOut() != null ? booking.getCheckOut() : booking.getCheckIn();
        return !booking.getCheckIn().isAfter(trip.getReturnDate())
                && !bookingEnd.isBefore(trip.getDepartureDate());
    }

    private static void accumulateBooking(Map<String, Slice> slices, Booking booking) {
        boolean hasComponents = false;
        hasComponents |= accumulate(slices, CATEGORY_FLIGHTS, booking.getFlightAmount());
        hasComponents |= accumulate(slices, CATEGORY_HOTELS, booking.getHotelAmount());
        hasComponents |= accumulate(slices, CATEGORY_RESTAURANTS, booking.getRestaurantAmount());
        hasComponents |= accumulate(slices, CATEGORY_CRUISES, booking.getCruiseAmount());

        if (!hasComponents && booking.getTotalAmount() != null) {
            accumulate(slices, inferCategory(booking), booking.getTotalAmount());
        }
    }

    /** Falls back to the vertical whose reference id is set on the booking. */
    private static String inferCategory(Booking booking) {
        if (booking.getFlightId() != null) return CATEGORY_FLIGHTS;
        if (booking.getCruiseId() != null) return CATEGORY_CRUISES;
        if (booking.getRestaurantId() != null) return CATEGORY_RESTAURANTS;
        if (booking.getHotelId() != null) return CATEGORY_HOTELS;
        return TripExpenseCategory.OTHER.name();
    }

    private static boolean accumulate(Map<String, Slice> slices, String category, BigDecimal amount) {
        if (amount == null || amount.signum() == 0) {
            return false;
        }
        slices.computeIfAbsent(category, k -> new Slice()).add(amount);
        return true;
    }

    private static Double percentUsed(BigDecimal budget, BigDecimal totalSpent) {
        if (budget == null || budget.signum() <= 0) {
            return null;
        }
        return totalSpent.multiply(BigDecimal.valueOf(100))
                .divide(budget, PERCENT_SCALE, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private TravelRequest ownedTrip(String email, UUID tripId) {
        return requestRepository.findByIdAndUserEmail(tripId, email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.REQUEST_NOT_FOUND));
    }

    /** Mutable accumulator for one breakdown category. */
    private static final class Slice {
        private BigDecimal amount = BigDecimal.ZERO;
        private long count;

        private void add(BigDecimal value) {
            amount = amount.add(value);
            count++;
        }
    }
}
