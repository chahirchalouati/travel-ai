package com.travelai.loyalty.dto;

import com.travelai.loyalty.MemberReward;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** A reward a member owns, with its lifecycle and snapshotted value. */
public record MemberRewardResponse(
        UUID id,
        String rewardCode,
        String source,
        String status,
        String type,
        BigDecimal discountAmount,
        BigDecimal discountPct,
        String perkCode,
        Instant unlockedAt,
        Instant expiresAt,
        Instant usedAt) {

    public static MemberRewardResponse from(MemberReward r) {
        return new MemberRewardResponse(
                r.getId(), r.getRewardCode(), r.getSource().name(), r.getStatus().name(),
                r.getType().name(), r.getDiscountAmount(), r.getDiscountPct(), r.getPerkCode(),
                r.getUnlockedAt(), r.getExpiresAt(), r.getUsedAt());
    }
}
