package com.travelai.booking;

import com.travelai.auth.User;
import com.travelai.booking.dto.CreateBookingRequest;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import com.travelai.subscription.SubscriptionService;
import com.travelai.subscription.dto.MembershipResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;

/**
 * Server-authoritative validation of the Travel AI Prime member discount: a discount
 * claimed by the client is only honoured when the caller holds an active membership
 * and the amount matches what the plan grants.
 */
@ExtendWith(MockitoExtension.class)
class BookingMemberDiscountTest {

    private static final String EMAIL = "member@travelai.io";

    @Mock private SubscriptionService subscriptionService;

    private BookingService service;
    private User user;

    @BeforeEach
    void setUp() {
        // Only the subscription dependency participates in discount validation.
        service = new BookingService(
                null, null, null, null, null, null, null, null, null,
                null, null, null, subscriptionService, null, null);
        user = new User();
        user.setEmail(EMAIL);
    }

    private void mockMembership(boolean active, String pct) {
        lenient().when(subscriptionService.membership(EMAIL)).thenReturn(new MembershipResponse(
                active, active ? "PRIME" : null, active ? "Travel AI Prime" : null,
                null, null, active, new BigDecimal(pct)));
    }

    /** subtotal 200 + memberDiscountAmount (5%) = the two fields the guard reads. */
    private CreateBookingRequest request(BigDecimal subtotal, BigDecimal memberDiscount) {
        return new CreateBookingRequest(
                null, null, null, null, null, "Rome", null, null,
                new BigDecimal("200.00"), null, null, null, null, null, null, null,
                2, null, subtotal, memberDiscount, null, null, null, null, List.of());
    }

    @Test
    @DisplayName("accepts the exact discount an active member is entitled to")
    void acceptsEntitledDiscount() {
        mockMembership(true, "5.00");
        // 5% of 200.00 = 10.00
        assertThatCode(() -> service.validateMemberDiscount(user, request(
                new BigDecimal("200.00"), new BigDecimal("10.00"))))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("accepts a member claiming less than entitled")
    void acceptsUnderClaim() {
        mockMembership(true, "5.00");
        assertThatCode(() -> service.validateMemberDiscount(user, request(
                new BigDecimal("200.00"), new BigDecimal("4.00"))))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("skips validation when no discount is claimed")
    void skipsWhenNothingClaimed() {
        assertThatCode(() -> service.validateMemberDiscount(user, request(
                new BigDecimal("200.00"), null)))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("rejects a discount claimed by a non-member")
    void rejectsNonMember() {
        mockMembership(false, "0");
        assertThatThrownBy(() -> service.validateMemberDiscount(user, request(
                new BigDecimal("200.00"), new BigDecimal("10.00"))))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> org.assertj.core.api.Assertions
                        .assertThat(((TravelAiException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.MEMBER_DISCOUNT_INVALID));
    }

    @Test
    @DisplayName("rejects a member over-claiming beyond the entitled amount")
    void rejectsOverClaim() {
        mockMembership(true, "5.00");
        // entitled = 10.00; claiming 25.00 is well over tolerance
        assertThatThrownBy(() -> service.validateMemberDiscount(user, request(
                new BigDecimal("200.00"), new BigDecimal("25.00"))))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> org.assertj.core.api.Assertions
                        .assertThat(((TravelAiException) ex).getHttpStatus())
                        .isEqualTo(400));
    }
}
