package com.travelai.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Full 360° view of a single booking: core data + customer + payments + the customer's reviews. */
public record AdminBookingDetailResponse(
        UUID id,
        String bookingReference,
        String status,
        String destination,
        LocalDate checkIn,
        LocalDate checkOut,
        Integer partySize,
        BigDecimal totalAmount,
        BigDecimal hotelAmount,
        BigDecimal flightAmount,
        BigDecimal restaurantAmount,
        BigDecimal cruiseAmount,
        BigDecimal serviceFeeAmount,
        BigDecimal commissionAmount,
        Instant createdAt,
        UserSummary user,
        List<PaymentLine> payments,
        List<ReviewLine> userReviews,
        long userTotalBookings) {

    public record UserSummary(
            UUID id,
            String email,
            String firstName,
            String lastName,
            String role,
            boolean active,
            Instant createdAt) {}

    public record PaymentLine(
            UUID id,
            String status,
            String type,
            String gateway,
            BigDecimal amount,
            String currency,
            LocalDateTime paidAt,
            LocalDateTime refundedAt,
            String failureReason,
            Instant createdAt) {}

    public record ReviewLine(
            UUID id,
            String targetType,
            int rating,
            String title,
            Instant createdAt) {}
}
