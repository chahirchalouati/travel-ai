package com.travelai.loyalty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoyaltyRewardRepository extends JpaRepository<LoyaltyReward, UUID> {

    List<LoyaltyReward> findByActiveTrueOrderBySortOrderAsc();

    List<LoyaltyReward> findByActiveTrueAndUnlockKindOrderByThresholdPointsAsc(RewardUnlockKind unlockKind);

    Optional<LoyaltyReward> findByCodeIgnoreCase(String code);
}
