package com.travelai.loyalty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberRewardRepository extends JpaRepository<MemberReward, UUID> {

    List<MemberReward> findByUserIdOrderByUnlockedAtDesc(UUID userId);

    List<MemberReward> findByUserIdAndStatus(UUID userId, MemberRewardStatus status);

    boolean existsByUserIdAndRewardCodeAndSource(UUID userId, String rewardCode, RewardSource source);

    Optional<MemberReward> findByIdAndUserId(UUID id, UUID userId);
}
