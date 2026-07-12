package com.travelai.subscription;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** A sellable membership plan with server-authoritative price and benefits. */
@Entity
@Table(name = "subscription_plan")
@Getter
@Setter
public class SubscriptionPlan extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private String currency = "EUR";

    @Column(name = "billing_interval", nullable = false)
    private String billingInterval = "ANNUAL";

    @Column(name = "service_fee_waived", nullable = false)
    private boolean serviceFeeWaived = false;

    @Column(name = "member_discount_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal memberDiscountPct = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
