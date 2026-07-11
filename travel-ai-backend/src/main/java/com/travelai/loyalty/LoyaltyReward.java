package com.travelai.loyalty;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

import static jakarta.persistence.EnumType.STRING;

/**
 * A reward definition in the loyalty catalogue. Server-authoritative: thresholds,
 * point costs and values live here and are never trusted from the client.
 */
@Entity
@Table(name = "loyalty_reward")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyReward extends BaseEntity {

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 255)
    private String description;

    @Enumerated(STRING)
    @Column(nullable = false, length = 20)
    private RewardType type;

    @Enumerated(STRING)
    @Column(name = "unlock_kind", nullable = false, length = 20)
    private RewardUnlockKind unlockKind;

    /** MILESTONE only: lifetime points required to unlock. */
    @Column(name = "threshold_points")
    private Integer thresholdPoints;

    /** REDEEMABLE only: points spent to claim. */
    @Column(name = "cost_points")
    private Integer costPoints;

    /** VOUCHER only: fixed EUR discount. */
    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    /** VOUCHER only: percentage discount (alternative to a fixed amount). */
    @Column(name = "discount_pct", precision = 5, scale = 2)
    private BigDecimal discountPct;

    /** PERK only: which benefit the perk grants. */
    @Column(name = "perk_code", length = 40)
    private String perkCode;

    /** Days the unlocked reward stays usable; null means no expiry. */
    @Column(name = "valid_days")
    private Integer validDays;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
