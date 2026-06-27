package com.travelai.shared.exception;

public enum ErrorCode {
    USER_NOT_FOUND("User not found"),
    USER_ALREADY_EXISTS("User already exists"),
    INVALID_CREDENTIALS("Invalid credentials"),
    TOKEN_EXPIRED("Token has expired"),
    TOKEN_INVALID("Token is invalid"),
    ACCESS_DENIED("Access denied"),
    VALIDATION_ERROR("Validation error"),
    PARTNER_NOT_FOUND("Partner not found"),
    BOOKING_NOT_FOUND("Booking not found"),
    PAYMENT_FAILED("Payment failed"),
    AVAILABILITY_UNAVAILABLE("Availability unavailable"),
    PROPOSAL_NOT_FOUND("Proposal not found"),
    REQUEST_NOT_FOUND("Request not found"),
    INTERNAL_ERROR("Internal server error");

    private final String message;

    ErrorCode(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
