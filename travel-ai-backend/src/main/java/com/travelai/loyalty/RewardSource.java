package com.travelai.loyalty;

/** How a member came to own a reward instance. */
public enum RewardSource {
    /** Auto-unlocked by crossing a lifetime-points milestone. */
    MILESTONE,
    /** Claimed from the catalogue by spending points. */
    REDEMPTION
}
