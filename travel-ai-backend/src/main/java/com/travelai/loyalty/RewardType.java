package com.travelai.loyalty;

/** What an unlocked loyalty reward gives the member. */
public enum RewardType {
    /** A monetary discount applied to a future booking. */
    VOUCHER,
    /** A non-monetary benefit flagged on a booking (upgrade, priority check-in, ...). */
    PERK,
    /** A physical or experiential prize fulfilled offline by staff. */
    GIFT
}
