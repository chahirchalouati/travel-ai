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
    BOOKING_ALREADY_CANCELLED("Booking is already cancelled"),
    BOOKING_NOT_CANCELLABLE("Booking cannot be cancelled"),
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
    PROMO_CODE_NOT_FOUND("Promo code not found"),
    FEATURE_FLAG_NOT_FOUND("Feature flag not found"),
    PROMO_CODE_DUPLICATE("A promo code with this code already exists"),
    LOYALTY_REDEEM_INVALID("Points redemption is not valid"),
    MEMBER_DISCOUNT_INVALID("Prime member discount is not valid"),
    REWARD_NOT_FOUND("Reward not found"),
    REWARD_NOT_REDEEMABLE("This reward cannot be redeemed"),
    REWARD_INSUFFICIENT_POINTS("Not enough points to redeem this reward"),
    REWARD_NOT_USABLE("This reward is not available to use"),
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
    MFA_CODE_INVALID("Two-factor code is invalid"),
    MFA_NOT_PENDING("No two-factor setup is pending"),
    MFA_ALREADY_ENABLED("Two-factor authentication is already enabled"),
    MFA_NOT_ENABLED("Two-factor authentication is not enabled"),
    TRIP_MEMBER_NOT_FOUND("Trip member not found"),
    TRIP_MEMBER_ALREADY_EXISTS("This person is already invited to the trip"),
    TRIP_INVITE_INVALID("Invite is invalid or was already used"),
    EXPENSE_NOT_FOUND("Trip expense not found"),
    SOCIAL_LOGIN_DISABLED("Social login is not configured"),
    SOCIAL_TOKEN_INVALID("Social login token is invalid or expired"),
    SUBSCRIPTION_PLAN_NOT_FOUND("Subscription plan not found"),
    SUBSCRIPTION_NOT_FOUND("No active subscription found"),
    INTERNAL_ERROR("Internal server error");

    private final String message;

    ErrorCode(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
