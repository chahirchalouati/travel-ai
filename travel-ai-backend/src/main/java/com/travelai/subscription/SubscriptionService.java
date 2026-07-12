package com.travelai.subscription;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.subscription.dto.AdminSubscriptionResponse;
import com.travelai.subscription.dto.MembershipResponse;
import com.travelai.subscription.dto.SubscriptionPlanResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Reads membership plans and manages a user's subscription. Payment is simulated
 * (consistent with the rest of the platform): subscribing activates the membership
 * immediately and records the price paid for revenue reporting.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionService {

    private static final long ANNUAL_DAYS = 365;
    private static final long MONTHLY_DAYS = 30;

    private final SubscriptionPlanRepository planRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> plans() {
        return planRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(SubscriptionPlanResponse::from)
                .toList();
    }

    /** Admin: paginated Prime memberships, optionally filtered by status, newest first. */
    @Transactional(readOnly = true)
    public Page<AdminSubscriptionResponse> adminList(String status, Pageable pageable) {
        SubscriptionStatus filter = parseStatus(status);
        Page<UserSubscription> page = filter != null
                ? subscriptionRepository.findByStatus(filter, pageable)
                : subscriptionRepository.findAll(pageable);
        Map<String, String> planNames = planRepository.findAll().stream()
                .collect(Collectors.toMap(SubscriptionPlan::getCode, SubscriptionPlan::getName, (a, b) -> a));
        return page.map(s -> AdminSubscriptionResponse.from(
                s, planNames.getOrDefault(s.getPlanCode(), s.getPlanCode())));
    }

    private SubscriptionStatus parseStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        try {
            return SubscriptionStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }
    }

    /** The caller's current membership status and benefits. */
    @Transactional(readOnly = true)
    public MembershipResponse membership(String email) {
        User user = requireUser(email);
        return activeSubscription(user)
                .map(this::toMembership)
                .orElseGet(MembershipResponse::inactive);
    }

    /**
     * Subscribes the caller to a plan. Any existing active membership is cancelled
     * first, so this also covers plan switches and re-subscription. Payment is
     * simulated and the membership is activated immediately.
     */
    public MembershipResponse subscribe(String email, String planCode) {
        User user = requireUser(email);
        SubscriptionPlan plan = planRepository.findByCodeIgnoreCase(planCode.trim())
                .filter(SubscriptionPlan::isActive)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.SUBSCRIPTION_PLAN_NOT_FOUND));

        activeSubscription(user).ifPresent(existing -> {
            existing.setStatus(SubscriptionStatus.CANCELLED);
            existing.setCancelledAt(Instant.now());
            subscriptionRepository.save(existing);
        });

        Instant now = Instant.now();
        UserSubscription sub = new UserSubscription();
        sub.setUser(user);
        sub.setPlanCode(plan.getCode());
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartedAt(now);
        sub.setRenewsAt(now.plus(renewalDays(plan.getBillingInterval()), ChronoUnit.DAYS));
        sub.setPricePaid(plan.getPrice());
        sub.setCurrency(plan.getCurrency());
        subscriptionRepository.save(sub);

        return toMembership(sub);
    }

    /** Cancels the caller's active membership; benefits stop immediately. */
    public MembershipResponse cancel(String email) {
        User user = requireUser(email);
        UserSubscription sub = activeSubscription(user)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.SUBSCRIPTION_NOT_FOUND));
        sub.setStatus(SubscriptionStatus.CANCELLED);
        sub.setCancelledAt(Instant.now());
        subscriptionRepository.save(sub);
        return MembershipResponse.inactive();
    }

    private java.util.Optional<UserSubscription> activeSubscription(User user) {
        return subscriptionRepository
                .findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE);
    }

    private MembershipResponse toMembership(UserSubscription sub) {
        SubscriptionPlan plan = planRepository.findByCodeIgnoreCase(sub.getPlanCode()).orElse(null);
        boolean feeWaived = plan != null && plan.isServiceFeeWaived();
        java.math.BigDecimal discount = plan != null ? plan.getMemberDiscountPct() : java.math.BigDecimal.ZERO;
        String name = plan != null ? plan.getName() : sub.getPlanCode();
        return new MembershipResponse(true, sub.getPlanCode(), name,
                sub.getStartedAt(), sub.getRenewsAt(), feeWaived, discount);
    }

    private long renewalDays(String interval) {
        return "MONTHLY".equalsIgnoreCase(interval) ? MONTHLY_DAYS : ANNUAL_DAYS;
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
    }
}
