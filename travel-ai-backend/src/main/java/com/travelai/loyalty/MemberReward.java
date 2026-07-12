package com.travelai.loyalty;

import com.travelai.auth.User;
import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

/**
 * A reward a member has unlocked (via milestone) or claimed (via redemption).
 * The reward's value is snapshotted here at unlock time so later catalogue edits
 * never change what the member already holds.
 */
@Entity
@Table(name = "loyalty_member_reward")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberReward extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "reward_code", nullable = false, length = 40)
    private String rewardCode;

    @Enumerated(STRING)
    @Column(nullable = false, length = 20)
    private RewardSource source;

    @Builder.Default
    @Enumerated(STRING)
    @Column(nullable = false, length = 20)
    private MemberRewardStatus status = MemberRewardStatus.UNLOCKED;

    @Enumerated(STRING)
    @Column(nullable = false, length = 20)
    private RewardType type;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "discount_pct", precision = 5, scale = 2)
    private BigDecimal discountPct;

    @Column(name = "perk_code", length = 40)
    private String perkCode;

    @Builder.Default
    @Column(name = "unlocked_at", nullable = false)
    private Instant unlockedAt = Instant.now();

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "booking_id")
    private UUID bookingId;
}
