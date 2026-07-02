package com.travelai.travel.budget;

import com.travelai.auth.User;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.booking.BookingStatus;
import com.travelai.travel.TravelProposal;
import com.travelai.travel.TravelProposalRepository;
import com.travelai.travel.TravelRequest;
import com.travelai.travel.TravelRequestRepository;
import com.travelai.travel.budget.dto.TripBudgetSummaryResponse;
import com.travelai.travel.budget.dto.TripBudgetSummaryResponse.CategorySpend;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TripBudgetService.getSummary")
class TripBudgetServiceTest {

    private static final String EMAIL = "traveller@example.com";
    private static final UUID TRIP_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();
    private static final LocalDate DEPARTURE = LocalDate.of(2026, 8, 1);
    private static final LocalDate RETURN = LocalDate.of(2026, 8, 10);

    @Mock private TravelRequestRepository requestRepository;
    @Mock private TravelProposalRepository proposalRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private TripExpenseRepository expenseRepository;

    @InjectMocks private TripBudgetService service;

    private TravelRequest trip;

    @BeforeEach
    void setUp() {
        User user = mock(User.class);
        lenient().when(user.getId()).thenReturn(USER_ID);

        trip = new TravelRequest();
        trip.setUser(user);
        trip.setDepartureDate(DEPARTURE);
        trip.setReturnDate(RETURN);

        lenient().when(requestRepository.findByIdAndUserEmail(TRIP_ID, EMAIL)).thenReturn(Optional.of(trip));
        lenient().when(proposalRepository.findByRequestIdOrderByRankScoreDesc(any())).thenReturn(List.of());
        lenient().when(bookingRepository.findByUserId(USER_ID)).thenReturn(List.of());
        lenient().when(expenseRepository.findByTripIdOrderByCreatedAtDesc(any())).thenReturn(List.of());
    }

    private static Booking booking(BookingStatus status, LocalDate checkIn, LocalDate checkOut) {
        Booking b = new Booking();
        b.setStatus(status);
        b.setCheckIn(checkIn);
        b.setCheckOut(checkOut);
        return b;
    }

    private static TripExpense expense(TripExpenseCategory category, String amount) {
        TripExpense e = new TripExpense();
        e.setTripId(TRIP_ID);
        e.setUserId(USER_ID);
        e.setCategory(category);
        e.setAmount(new BigDecimal(amount));
        return e;
    }

    private static BigDecimal amountOf(TripBudgetSummaryResponse summary, String category) {
        return summary.breakdown().stream()
                .filter(s -> s.category().equals(category))
                .map(CategorySpend::amount)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("excludes cancelled bookings from the spend")
    void excludesCancelledBookings() {
        Booking confirmed = booking(BookingStatus.CONFIRMED, DEPARTURE.plusDays(1), DEPARTURE.plusDays(4));
        confirmed.setHotelAmount(new BigDecimal("400.00"));
        Booking cancelled = booking(BookingStatus.CANCELLED, DEPARTURE.plusDays(1), DEPARTURE.plusDays(4));
        cancelled.setHotelAmount(new BigDecimal("999.00"));
        when(bookingRepository.findByUserId(USER_ID)).thenReturn(List.of(confirmed, cancelled));

        TripBudgetSummaryResponse summary = service.getSummary(EMAIL, TRIP_ID);

        assertThat(summary.totalSpent()).isEqualByComparingTo("400.00");
        assertThat(amountOf(summary, "HOTEL")).isEqualByComparingTo("400.00");
    }

    @Test
    @DisplayName("merges booking verticals with manual expense categories")
    void mergesBookingsAndManualExpenses() {
        Booking bundle = booking(BookingStatus.CONFIRMED, DEPARTURE, RETURN);
        bundle.setFlightAmount(new BigDecimal("200.00"));
        bundle.setHotelAmount(new BigDecimal("300.00"));
        when(bookingRepository.findByUserId(USER_ID)).thenReturn(List.of(bundle));
        when(expenseRepository.findByTripIdOrderByCreatedAtDesc(any()))
                .thenReturn(List.of(expense(TripExpenseCategory.FOOD, "50.00"),
                        expense(TripExpenseCategory.FOOD, "25.00")));

        TripBudgetSummaryResponse summary = service.getSummary(EMAIL, TRIP_ID);

        assertThat(summary.totalSpent()).isEqualByComparingTo("575.00");
        assertThat(amountOf(summary, "VOLI")).isEqualByComparingTo("200.00");
        assertThat(amountOf(summary, "HOTEL")).isEqualByComparingTo("300.00");
        assertThat(amountOf(summary, "FOOD")).isEqualByComparingTo("75.00");
        assertThat(summary.breakdown().stream()
                .filter(s -> s.category().equals("FOOD"))
                .findFirst().orElseThrow().count()).isEqualTo(2);
    }

    @Test
    @DisplayName("computes percentUsed and remaining against the budget")
    void computesPercentUsed() {
        trip.setBudgetAmount(new BigDecimal("1000.00"));
        Booking b = booking(BookingStatus.CONFIRMED, DEPARTURE, DEPARTURE.plusDays(2));
        b.setHotelAmount(new BigDecimal("825.00"));
        when(bookingRepository.findByUserId(USER_ID)).thenReturn(List.of(b));

        TripBudgetSummaryResponse summary = service.getSummary(EMAIL, TRIP_ID);

        assertThat(summary.budget()).isEqualByComparingTo("1000.00");
        assertThat(summary.percentUsed()).isEqualTo(82.5);
        assertThat(summary.remaining()).isEqualByComparingTo("175.00");
    }

    @Test
    @DisplayName("no budget set: budget, remaining and percentUsed are null but spend is computed")
    void noBudgetCase() {
        Booking b = booking(BookingStatus.CONFIRMED, DEPARTURE, DEPARTURE.plusDays(2));
        b.setHotelAmount(new BigDecimal("120.00"));
        when(bookingRepository.findByUserId(USER_ID)).thenReturn(List.of(b));

        TripBudgetSummaryResponse summary = service.getSummary(EMAIL, TRIP_ID);

        assertThat(summary.budget()).isNull();
        assertThat(summary.remaining()).isNull();
        assertThat(summary.percentUsed()).isNull();
        assertThat(summary.totalSpent()).isEqualByComparingTo("120.00");
        assertThat(summary.currency()).isEqualTo("EUR");
    }

    @Test
    @DisplayName("bookings outside the trip dates are excluded unless linked via a proposal")
    void dateOverlapAndProposalLinkage() {
        Booking outside = booking(BookingStatus.CONFIRMED, RETURN.plusDays(30), RETURN.plusDays(35));
        outside.setHotelAmount(new BigDecimal("500.00"));

        UUID proposalId = UUID.randomUUID();
        TravelProposal proposal = mock(TravelProposal.class);
        when(proposal.getId()).thenReturn(proposalId);
        Booking viaProposal = booking(BookingStatus.CONFIRMED, null, null);
        viaProposal.setProposalId(proposalId);
        viaProposal.setFlightAmount(new BigDecimal("150.00"));

        when(proposalRepository.findByRequestIdOrderByRankScoreDesc(any())).thenReturn(List.of(proposal));
        when(bookingRepository.findByUserId(USER_ID)).thenReturn(List.of(outside, viaProposal));

        TripBudgetSummaryResponse summary = service.getSummary(EMAIL, TRIP_ID);

        assertThat(summary.totalSpent()).isEqualByComparingTo("150.00");
        assertThat(amountOf(summary, "VOLI")).isEqualByComparingTo("150.00");
        assertThat(amountOf(summary, "HOTEL")).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("a booking without component amounts falls back to totalAmount and its vertical id")
    void fallsBackToTotalAmount() {
        Booking cruise = booking(BookingStatus.CONFIRMED, DEPARTURE, RETURN);
        cruise.setCruiseId(UUID.randomUUID());
        cruise.setTotalAmount(new BigDecimal("890.00"));
        when(bookingRepository.findByUserId(USER_ID)).thenReturn(List.of(cruise));

        TripBudgetSummaryResponse summary = service.getSummary(EMAIL, TRIP_ID);

        assertThat(amountOf(summary, "CROCIERE")).isEqualByComparingTo("890.00");
        assertThat(summary.totalSpent()).isEqualByComparingTo("890.00");
    }
}
