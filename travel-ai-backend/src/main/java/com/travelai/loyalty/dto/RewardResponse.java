package com.travelai.loyalty.dto;

import com.travelai.loyalty.LoyaltyReward;

import java.math.BigDecimal;

/**
 * A catalogue reward as shown to members. {@code unlocked} / {@code redeemable}
 * are computed against the caller's lifetime points and balance so the UI can
 * render progress and enable the claim button.
 */
public record RewardResponse(
        String code,
        String name,
        String description,
        String type,
        String unlockKind,
        Integer thresholdPoints,
        Integer costPoints,
        BigDecimal discountAmount,
        BigDecimal discountPct,
        String perkCode,
        Integer validDays,
        boolean unlocked,
        boolean redeemable) {

    public static RewardResponse from(LoyaltyReward r, boolean unlocked, boolean redeemable) {
        return new RewardResponse(
                r.getCode(), r.getName(), r.getDescription(),
                r.getType().name(), r.getUnlockKind().name(),
                r.getThresholdPoints(), r.getCostPoints(),
                r.getDiscountAmount(), r.getDiscountPct(), r.getPerkCode(),
                r.getValidDays(), unlocked, redeemable);
    }
}
