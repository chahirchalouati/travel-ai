package com.travelai.subscription;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    List<SubscriptionPlan> findByActiveTrueOrderBySortOrderAsc();

    Optional<SubscriptionPlan> findByCodeIgnoreCase(String code);
}
