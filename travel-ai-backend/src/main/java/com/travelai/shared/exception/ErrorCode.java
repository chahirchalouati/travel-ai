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
    PAYMENT_NOT_FOUND("Payment not found"),
    PAYMENT_FAILED("Payment failed"),
    AVAILABILITY_UNAVAILABLE("Availability unavailable"),
    PROPOSAL_NOT_FOUND("Proposal not found"),
    REQUEST_NOT_FOUND("Request not found"),
    HOTEL_NOT_FOUND("Hotel not found"),
    RESTAURANT_NOT_FOUND("Restaurant not found"),
    FLIGHT_NOT_FOUND("Flight not found"),
    CRUISE_NOT_FOUND("Cruise not found"),
    WAITLIST_NOT_FOUND("Waitlist entry not found"),
    DESTINATION_NOT_FOUND("Destination not found"),
    REVIEW_NOT_FOUND("Review not found"),
    REVIEW_ALREADY_EXISTS("You have already reviewed this item"),
    CONVERSATION_NOT_FOUND("Conversation not found"),
    STORY_NOT_FOUND("Travel story not found"),
    PLACE_NOT_FOUND("Travel place not found"),
    PHOTO_NOT_FOUND("Photo not found"),
    SETTING_NOT_FOUND("Platform setting not found"),
    INTERNAL_ERROR("Internal server error");

    private final String message;

    ErrorCode(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
