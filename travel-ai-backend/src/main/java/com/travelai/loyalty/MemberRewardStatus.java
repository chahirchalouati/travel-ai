package com.travelai.loyalty;

/** Lifecycle of a member's reward instance. */
public enum MemberRewardStatus {
    /** Owned and usable. */
    UNLOCKED,
    /** Consumed on a booking. */
    USED,
    /** Past its validity window, no longer usable. */
    EXPIRED
}
