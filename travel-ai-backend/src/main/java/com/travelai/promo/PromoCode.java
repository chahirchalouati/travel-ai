package com.travelai.promo;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

import static jakarta.persistence.EnumType.STRING;

@Entity
@Table(name = "promo_codes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoCode extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal value;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "max_redemptions")
    private Integer maxRedemptions;

    @Builder.Default
    @Column(name = "times_redeemed", nullable = false)
    private int timesRedeemed = 0;
}
