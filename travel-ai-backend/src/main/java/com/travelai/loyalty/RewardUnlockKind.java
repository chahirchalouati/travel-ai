package com.travelai.loyalty;

/** How a catalogue reward is obtained. */
public enum RewardUnlockKind {
    /** Auto-unlocked, for free, when lifetime points cross the reward's threshold. */
    MILESTONE,
    /** Claimed by spending the points balance. */
    REDEEMABLE
}
