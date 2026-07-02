package com.travelai.subscription;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.subscription.dto.MembershipResponse;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock private SubscriptionPlanRepository planRepository;
    @Mock private UserSubscriptionRepository subscriptionRepository;
    @Mock private UserRepository userRepository;

    private SubscriptionService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new SubscriptionService(planRepository, subscriptionRepository, userRepository);
        user = new User();
        // BaseEntity id is generated; stub the lookup via a spy-free approach:
        when(userRepository.findByEmail("u@x.io")).thenReturn(Optional.of(user));
    }

    private SubscriptionPlan primePlan() {
        SubscriptionPlan p = new SubscriptionPlan();
        p.setCode("PRIME");
        p.setName("Travel AI Prime");
        p.setPrice(new BigDecimal("39.00"));
        p.setCurrency("EUR");
        p.setBillingInterval("ANNUAL");
        p.setServiceFeeWaived(true);
        p.setMemberDiscountPct(new BigDecimal("5.00"));
        p.setActive(true);
        return p;
    }

    @Test
    @DisplayName("membership returns inactive when the user has no active subscription")
    void membership_inactiveByDefault() {
        when(subscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(any(), eq(SubscriptionStatus.ACTIVE)))
                .thenReturn(Optional.empty());

        MembershipResponse res = service.membership("u@x.io");

        assertThat(res.active()).isFalse();
        assertThat(res.serviceFeeWaived()).isFalse();
    }

    @Test
    @DisplayName("subscribe activates the plan and exposes its benefits")
    void subscribe_activatesPlan() {
        when(planRepository.findByCodeIgnoreCase("PRIME")).thenReturn(Optional.of(primePlan()));
        when(subscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(any(), eq(SubscriptionStatus.ACTIVE)))
                .thenReturn(Optional.empty());
        when(subscriptionRepository.save(any(UserSubscription.class))).thenAnswer(i -> i.getArgument(0));

        MembershipResponse res = service.subscribe("u@x.io", "PRIME");

        assertThat(res.active()).isTrue();
        assertThat(res.planCode()).isEqualTo("PRIME");
        assertThat(res.serviceFeeWaived()).isTrue();
        assertThat(res.memberDiscountPct()).isEqualByComparingTo("5.00");
        verify(subscriptionRepository).save(any(UserSubscription.class));
    }

    @Test
    @DisplayName("subscribe cancels an existing active membership before creating the new one")
    void subscribe_switchesPlan() {
        UserSubscription existing = new UserSubscription();
        existing.setStatus(SubscriptionStatus.ACTIVE);
        when(planRepository.findByCodeIgnoreCase("PRIME")).thenReturn(Optional.of(primePlan()));
        when(subscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(any(), eq(SubscriptionStatus.ACTIVE)))
                .thenReturn(Optional.of(existing));
        when(subscriptionRepository.save(any(UserSubscription.class))).thenAnswer(i -> i.getArgument(0));

        service.subscribe("u@x.io", "PRIME");

        assertThat(existing.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);
        assertThat(existing.getCancelledAt()).isNotNull();
        verify(subscriptionRepository, times(2)).save(any(UserSubscription.class));
    }

    @Test
    @DisplayName("subscribe rejects an unknown plan code")
    void subscribe_unknownPlan() {
        when(planRepository.findByCodeIgnoreCase("GHOST")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.subscribe("u@x.io", "GHOST"))
                .isInstanceOf(TravelAiException.class);
    }

    @Test
    @DisplayName("cancel throws when there is no active membership")
    void cancel_noActive() {
        when(subscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(any(), eq(SubscriptionStatus.ACTIVE)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancel("u@x.io"))
                .isInstanceOf(TravelAiException.class);
    }
}
