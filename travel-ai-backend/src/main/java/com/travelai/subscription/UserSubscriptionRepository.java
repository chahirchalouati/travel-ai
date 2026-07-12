package com.travelai.subscription;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UUID> {

    Optional<UserSubscription> findFirstByUserIdAndStatusOrderByStartedAtDesc(UUID userId, SubscriptionStatus status);

    List<UserSubscription> findByStatus(SubscriptionStatus status);

    /** Paginated admin listing filtered by membership status. */
    Page<UserSubscription> findByStatus(SubscriptionStatus status, Pageable pageable);

    long countByStatus(SubscriptionStatus status);

    /** Total membership revenue booked for subscriptions in the given status. */
    @Query("SELECT coalesce(sum(s.pricePaid), 0) FROM UserSubscription s WHERE s.status = :status")
    BigDecimal sumPricePaidByStatus(@Param("status") SubscriptionStatus status);
}
