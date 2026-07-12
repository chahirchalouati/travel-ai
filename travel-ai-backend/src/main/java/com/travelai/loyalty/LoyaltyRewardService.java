package com.travelai.loyalty;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.loyalty.dto.MemberRewardResponse;
import com.travelai.loyalty.dto.RewardResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * The loyalty rewards catalogue and a member's owned rewards. Two acquisition
 * paths converge here:
 * <ul>
 *   <li><b>Milestones</b> are auto-unlocked (for free) when lifetime points cross
 *       a threshold — see {@link #unlockMilestones}, invoked on every earn.</li>
 *   <li><b>Redeemable</b> rewards are claimed by spending the points balance.</li>
 * </ul>
 * All thresholds, costs and values are read from the server-side catalogue and
 * snapshotted onto the member reward, so the client is never trusted for them.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class LoyaltyRewardService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    /** Rounding slack (currency units) tolerated between client- and server-computed voucher value. */
    private static final BigDecimal VOUCHER_TOLERANCE = new BigDecimal("0.01");

    private final LoyaltyRewardRepository rewardRepository;
    private final MemberRewardRepository memberRewardRepository;
    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    /** The catalogue, annotated with what the caller has unlocked / can redeem now. */
    @Transactional(readOnly = true)
    public List<RewardResponse> catalogue(String userEmail) {
        LoyaltyAccount account = accountRepository.findByUserEmail(userEmail).orElse(null);
        int lifetime = account != null ? account.getLifetimePoints() : 0;
        int balance = account != null ? account.getPointsBalance() : 0;

        return rewardRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(r -> RewardResponse.from(r,
                        isUnlocked(r, lifetime),
                        isRedeemableNow(r, balance)))
                .toList();
    }

    /** The rewards the caller owns, newest first. */
    @Transactional(readOnly = true)
    public List<MemberRewardResponse> myRewards(String userEmail) {
        User user = requireUser(userEmail);
        return memberRewardRepository.findByUserIdOrderByUnlockedAtDesc(user.getId()).stream()
                .map(MemberRewardResponse::from)
                .toList();
    }

    /**
     * Grants every milestone reward whose threshold the given lifetime points now
     * meet and that the user does not already own. Idempotent: safe to call on
     * every earn. Invoked by {@link LoyaltyService#awardForPayment}.
     */
    public void unlockMilestones(User user, int lifetimePoints) {
        List<LoyaltyReward> milestones = rewardRepository
                .findByActiveTrueAndUnlockKindOrderByThresholdPointsAsc(RewardUnlockKind.MILESTONE);
        for (LoyaltyReward reward : milestones) {
            Integer threshold = reward.getThresholdPoints();
            if (threshold == null || lifetimePoints < threshold) {
                continue;
            }
            boolean alreadyOwned = memberRewardRepository
                    .existsByUserIdAndRewardCodeAndSource(user.getId(), reward.getCode(), RewardSource.MILESTONE);
            if (alreadyOwned) {
                continue;
            }
            memberRewardRepository.save(instanceOf(user, reward, RewardSource.MILESTONE));
            log.info("Loyalty: user {} unlocked milestone reward {} at {} lifetime pts",
                    user.getId(), reward.getCode(), lifetimePoints);
        }
    }

    /**
     * Claims a redeemable reward by spending its point cost from the balance.
     * Rejects (400) when the reward is missing, not redeemable, or the balance is
     * short. Writes a REDEEM ledger entry and returns the granted reward.
     */
    public MemberRewardResponse redeem(String userEmail, String rewardCode) {
        User user = requireUser(userEmail);
        LoyaltyReward reward = rewardRepository.findByCodeIgnoreCase(rewardCode.trim())
                .filter(LoyaltyReward::isActive)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.REWARD_NOT_FOUND));
        if (reward.getUnlockKind() != RewardUnlockKind.REDEEMABLE || reward.getCostPoints() == null) {
            throw TravelAiException.badRequest(ErrorCode.REWARD_NOT_REDEEMABLE);
        }

        LoyaltyAccount account = accountRepository.findByUserId(user.getId())
                .orElseThrow(() -> TravelAiException.badRequest(ErrorCode.REWARD_INSUFFICIENT_POINTS));
        int cost = reward.getCostPoints();
        if (account.getPointsBalance() < cost) {
            throw TravelAiException.badRequest(ErrorCode.REWARD_INSUFFICIENT_POINTS);
        }

        account.setPointsBalance(account.getPointsBalance() - cost);
        accountRepository.save(account);
        transactionRepository.save(LoyaltyTransaction.builder()
                .account(account)
                .type(LoyaltyTransactionType.REDEEM)
                .points(-cost)
                .description("Redeemed reward " + reward.getCode())
                .build());

        MemberReward granted = memberRewardRepository.save(instanceOf(user, reward, RewardSource.REDEMPTION));
        log.info("Loyalty: user {} redeemed reward {} for {} pts", user.getId(), reward.getCode(), cost);
        return MemberRewardResponse.from(granted);
    }

    /**
     * Applies an unlocked VOUCHER reward to a booking, server-authoritatively: the
     * discount the client claimed must not exceed the reward's snapshotted value,
     * the reward must belong to the caller, be UNLOCKED, a VOUCHER and unexpired.
     * On success the reward is marked USED against the booking and the entitled
     * discount returned. Rejects (400) otherwise, rolling the booking back.
     */
    public BigDecimal redeemVoucherForBooking(User user, UUID rewardId,
                                              BigDecimal claimedDiscount, BigDecimal base, UUID bookingId) {
        MemberReward reward = memberRewardRepository.findByIdAndUserId(rewardId, user.getId())
                .orElseThrow(() -> TravelAiException.badRequest(ErrorCode.REWARD_NOT_USABLE));
        boolean usable = reward.getStatus() == MemberRewardStatus.UNLOCKED
                && reward.getType() == RewardType.VOUCHER
                && (reward.getExpiresAt() == null || reward.getExpiresAt().isAfter(Instant.now()));
        if (!usable) {
            throw TravelAiException.badRequest(ErrorCode.REWARD_NOT_USABLE);
        }

        BigDecimal entitled = voucherValue(reward, base);
        BigDecimal claimed = claimedDiscount == null ? BigDecimal.ZERO : claimedDiscount;
        if (claimed.subtract(entitled).compareTo(VOUCHER_TOLERANCE) > 0) {
            log.warn("Rejected voucher {} for user {}: claimed={} entitled={}",
                    rewardId, user.getId(), claimed, entitled);
            throw TravelAiException.badRequest(ErrorCode.REWARD_NOT_USABLE);
        }

        reward.setStatus(MemberRewardStatus.USED);
        reward.setUsedAt(Instant.now());
        reward.setBookingId(bookingId);
        memberRewardRepository.save(reward);
        log.info("Loyalty: user {} used voucher {} (EUR {}) on booking {}",
                user.getId(), rewardId, entitled, bookingId);
        return entitled;
    }

    /** A voucher's EUR value: a fixed amount, else a percentage of the booking base. */
    private BigDecimal voucherValue(MemberReward reward, BigDecimal base) {
        if (reward.getDiscountAmount() != null) {
            return reward.getDiscountAmount();
        }
        if (reward.getDiscountPct() != null && base != null && base.signum() > 0) {
            return base.multiply(reward.getDiscountPct())
                    .divide(HUNDRED, 2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    /** A member reward instance from a catalogue reward, snapshotting its value. */
    private MemberReward instanceOf(User user, LoyaltyReward reward, RewardSource source) {
        Instant now = Instant.now();
        Instant expiresAt = reward.getValidDays() != null
                ? now.plus(reward.getValidDays(), ChronoUnit.DAYS)
                : null;
        return MemberReward.builder()
                .user(user)
                .rewardCode(reward.getCode())
                .source(source)
                .status(MemberRewardStatus.UNLOCKED)
                .type(reward.getType())
                .discountAmount(reward.getDiscountAmount())
                .discountPct(reward.getDiscountPct())
                .perkCode(reward.getPerkCode())
                .unlockedAt(now)
                .expiresAt(expiresAt)
                .build();
    }

    private boolean isUnlocked(LoyaltyReward r, int lifetimePoints) {
        return r.getUnlockKind() == RewardUnlockKind.MILESTONE
                && r.getThresholdPoints() != null
                && lifetimePoints >= r.getThresholdPoints();
    }

    private boolean isRedeemableNow(LoyaltyReward r, int balance) {
        return r.getUnlockKind() == RewardUnlockKind.REDEEMABLE
                && r.getCostPoints() != null
                && balance >= r.getCostPoints();
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
    }
}
