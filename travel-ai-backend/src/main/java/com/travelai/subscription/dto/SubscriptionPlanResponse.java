package com.travelai.subscription.dto;

import com.travelai.subscription.SubscriptionPlan;

import java.math.BigDecimal;

/** A sellable membership plan as offered to the client. */
public record SubscriptionPlanResponse(
        String code,
        String name,
        String description,
        BigDecimal price,
        String currency,
        String billingInterval,
        boolean serviceFeeWaived,
        BigDecimal memberDiscountPct) {

    public static SubscriptionPlanResponse from(SubscriptionPlan p) {
        return new SubscriptionPlanResponse(
                p.getCode(), p.getName(), p.getDescription(), p.getPrice(), p.getCurrency(),
                p.getBillingInterval(), p.isServiceFeeWaived(), p.getMemberDiscountPct());
    }
}
