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
    PRICE_WATCH_NOT_FOUND("Price watch not found"),
    PROMO_CODE_INVALID("Promo code is not valid"),
    LOYALTY_REDEEM_INVALID("Points redemption is not valid"),
    DESTINATION_NOT_FOUND("Destination not found"),
    ATTRACTION_NOT_FOUND("Attraction not found"),
    ITINERARY_NOT_FOUND("Live itinerary not found"),
    ITINERARY_SEGMENT_NOT_FOUND("Itinerary segment not found"),
    ITINERARY_PROPOSAL_NOT_FOUND("Itinerary proposal not found"),
    FORUM_QUESTION_NOT_FOUND("Question not found"),
    FORUM_ANSWER_NOT_FOUND("Answer not found"),
    REVIEW_NOT_FOUND("Review not found"),
    REVIEW_ALREADY_EXISTS("You have already reviewed this item"),
    CONVERSATION_NOT_FOUND("Conversation not found"),
    STORY_NOT_FOUND("Travel story not found"),
    PLACE_NOT_FOUND("Travel place not found"),
    PHOTO_NOT_FOUND("Photo not found"),
    SETTING_NOT_FOUND("Platform setting not found"),
    TRIP_MEMBER_NOT_FOUND("Trip member not found"),
    TRIP_MEMBER_ALREADY_EXISTS("This person is already invited to the trip"),
    TRIP_INVITE_INVALID("Invite is invalid or was already used"),
    EXPENSE_NOT_FOUND("Trip expense not found"),
    INTERNAL_ERROR("Internal server error");

    private final String message;

    ErrorCode(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
