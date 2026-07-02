package com.travelai.subscription;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UUID> {

    Optional<UserSubscription> findFirstByUserIdAndStatusOrderByStartedAtDesc(UUID userId, SubscriptionStatus status);

    List<UserSubscription> findByStatus(SubscriptionStatus status);
}
