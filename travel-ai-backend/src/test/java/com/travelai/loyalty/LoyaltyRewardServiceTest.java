package com.travelai.loyalty;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.loyalty.dto.MemberRewardResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LoyaltyRewardService")
class LoyaltyRewardServiceTest {

    @Mock private LoyaltyRewardRepository rewardRepository;
    @Mock private MemberRewardRepository memberRewardRepository;
    @Mock private LoyaltyAccountRepository accountRepository;
    @Mock private LoyaltyTransactionRepository transactionRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private LoyaltyRewardService service;

    private static User user(UUID id) {
        User u = mock(User.class);
        lenient().when(u.getId()).thenReturn(id);
        return u;
    }

    private static LoyaltyReward milestone(String code, int threshold) {
        return LoyaltyReward.builder()
                .code(code).name(code).type(RewardType.VOUCHER)
                .unlockKind(RewardUnlockKind.MILESTONE).thresholdPoints(threshold)
                .discountAmount(new BigDecimal("15.00")).validDays(365).active(true)
                .build();
    }

    private static LoyaltyReward redeemable(String code, int cost) {
        return LoyaltyReward.builder()
                .code(code).name(code).type(RewardType.VOUCHER)
                .unlockKind(RewardUnlockKind.REDEEMABLE).costPoints(cost)
                .discountAmount(new BigDecimal("10.00")).validDays(180).active(true)
                .build();
    }

    private static LoyaltyAccount account(User u, int balance) {
        return LoyaltyAccount.builder().user(u).pointsBalance(balance).lifetimePoints(balance).build();
    }

    // --- unlockMilestones -----------------------------------------------------

    @Test
    @DisplayName("unlocks a milestone reward once the lifetime threshold is met")
    void unlock_grantsCrossedMilestone() {
        UUID userId = UUID.randomUUID();
        User u = user(userId);
        when(rewardRepository.findByActiveTrueAndUnlockKindOrderByThresholdPointsAsc(RewardUnlockKind.MILESTONE))
                .thenReturn(List.of(milestone("M2000", 2000), milestone("M5000", 5000)));
        when(memberRewardRepository.existsByUserIdAndRewardCodeAndSource(any(), any(), any()))
                .thenReturn(false);

        service.unlockMilestones(u, 3000);

        // only the 2000 threshold is crossed; the 5000 one is not granted
        ArgumentCaptor<MemberReward> saved = ArgumentCaptor.forClass(MemberReward.class);
        verify(memberRewardRepository).save(saved.capture());
        assertThat(saved.getValue().getRewardCode()).isEqualTo("M2000");
        assertThat(saved.getValue().getSource()).isEqualTo(RewardSource.MILESTONE);
        assertThat(saved.getValue().getStatus()).isEqualTo(MemberRewardStatus.UNLOCKED);
        assertThat(saved.getValue().getDiscountAmount()).isEqualByComparingTo("15.00");
    }

    @Test
    @DisplayName("does not re-grant a milestone the member already owns")
    void unlock_idempotent() {
        User u = user(UUID.randomUUID());
        when(rewardRepository.findByActiveTrueAndUnlockKindOrderByThresholdPointsAsc(RewardUnlockKind.MILESTONE))
                .thenReturn(List.of(milestone("M2000", 2000)));
        when(memberRewardRepository.existsByUserIdAndRewardCodeAndSource(any(), eq("M2000"), any()))
                .thenReturn(true);

        service.unlockMilestones(u, 9000);

        verify(memberRewardRepository, never()).save(any());
    }

    // --- redeem ---------------------------------------------------------------

    @Test
    @DisplayName("redeeming spends points, writes a REDEEM entry and grants the reward")
    void redeem_happyPath() {
        User u = user(UUID.randomUUID());
        LoyaltyAccount acc = account(u, 2000);
        when(userRepository.findByEmail("m@x.io")).thenReturn(Optional.of(u));
        when(rewardRepository.findByCodeIgnoreCase("SHOP10")).thenReturn(Optional.of(redeemable("SHOP10", 1500)));
        when(accountRepository.findByUserId(u.getId())).thenReturn(Optional.of(acc));
        when(memberRewardRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MemberRewardResponse res = service.redeem("m@x.io", "SHOP10");

        assertThat(acc.getPointsBalance()).isEqualTo(500);
        assertThat(res.rewardCode()).isEqualTo("SHOP10");
        assertThat(res.source()).isEqualTo(RewardSource.REDEMPTION.name());
        ArgumentCaptor<LoyaltyTransaction> tx = ArgumentCaptor.forClass(LoyaltyTransaction.class);
        verify(transactionRepository).save(tx.capture());
        assertThat(tx.getValue().getType()).isEqualTo(LoyaltyTransactionType.REDEEM);
        assertThat(tx.getValue().getPoints()).isEqualTo(-1500);
    }

    @Test
    @DisplayName("rejects redeeming with an insufficient balance")
    void redeem_insufficientPoints_throws() {
        User u = user(UUID.randomUUID());
        when(userRepository.findByEmail("m@x.io")).thenReturn(Optional.of(u));
        when(rewardRepository.findByCodeIgnoreCase("SHOP10")).thenReturn(Optional.of(redeemable("SHOP10", 1500)));
        when(accountRepository.findByUserId(u.getId())).thenReturn(Optional.of(account(u, 900)));

        assertThatThrownBy(() -> service.redeem("m@x.io", "SHOP10"))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> assertThat(((TravelAiException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.REWARD_INSUFFICIENT_POINTS));
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("rejects redeeming a milestone reward from the catalogue")
    void redeem_nonRedeemable_throws() {
        User u = user(UUID.randomUUID());
        when(userRepository.findByEmail("m@x.io")).thenReturn(Optional.of(u));
        when(rewardRepository.findByCodeIgnoreCase("M2000")).thenReturn(Optional.of(milestone("M2000", 2000)));

        assertThatThrownBy(() -> service.redeem("m@x.io", "M2000"))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> assertThat(((TravelAiException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.REWARD_NOT_REDEEMABLE));
    }

    @Test
    @DisplayName("rejects an unknown reward code")
    void redeem_unknownReward_throws() {
        User u = user(UUID.randomUUID());
        when(userRepository.findByEmail("m@x.io")).thenReturn(Optional.of(u));
        when(rewardRepository.findByCodeIgnoreCase("NOPE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.redeem("m@x.io", "NOPE"))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> assertThat(((TravelAiException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.REWARD_NOT_FOUND));
    }

    // --- redeemVoucherForBooking ---------------------------------------------

    private static MemberReward ownedVoucher(User u, BigDecimal amount) {
        return MemberReward.builder()
                .user(u).rewardCode("V15").source(RewardSource.MILESTONE)
                .status(MemberRewardStatus.UNLOCKED).type(RewardType.VOUCHER)
                .discountAmount(amount).unlockedAt(java.time.Instant.now())
                .build();
    }

    @Test
    @DisplayName("applies a valid voucher, marks it used against the booking")
    void voucher_happyPath() {
        User u = user(UUID.randomUUID());
        UUID rewardId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();
        MemberReward voucher = ownedVoucher(u, new BigDecimal("15.00"));
        when(memberRewardRepository.findByIdAndUserId(rewardId, u.getId())).thenReturn(Optional.of(voucher));
        when(memberRewardRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        BigDecimal discount = service.redeemVoucherForBooking(
                u, rewardId, new BigDecimal("15.00"), new BigDecimal("200.00"), bookingId);

        assertThat(discount).isEqualByComparingTo("15.00");
        assertThat(voucher.getStatus()).isEqualTo(MemberRewardStatus.USED);
        assertThat(voucher.getBookingId()).isEqualTo(bookingId);
        assertThat(voucher.getUsedAt()).isNotNull();
    }

    @Test
    @DisplayName("rejects a voucher discount above the snapshotted value")
    void voucher_overClaim_throws() {
        User u = user(UUID.randomUUID());
        UUID rewardId = UUID.randomUUID();
        when(memberRewardRepository.findByIdAndUserId(rewardId, u.getId()))
                .thenReturn(Optional.of(ownedVoucher(u, new BigDecimal("15.00"))));

        assertThatThrownBy(() -> service.redeemVoucherForBooking(
                u, rewardId, new BigDecimal("40.00"), new BigDecimal("200.00"), UUID.randomUUID()))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> assertThat(((TravelAiException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.REWARD_NOT_USABLE));
        verify(memberRewardRepository, never()).save(any());
    }

    @Test
    @DisplayName("rejects a voucher already used")
    void voucher_alreadyUsed_throws() {
        User u = user(UUID.randomUUID());
        UUID rewardId = UUID.randomUUID();
        MemberReward used = ownedVoucher(u, new BigDecimal("15.00"));
        used.setStatus(MemberRewardStatus.USED);
        when(memberRewardRepository.findByIdAndUserId(rewardId, u.getId())).thenReturn(Optional.of(used));

        assertThatThrownBy(() -> service.redeemVoucherForBooking(
                u, rewardId, new BigDecimal("15.00"), new BigDecimal("200.00"), UUID.randomUUID()))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> assertThat(((TravelAiException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.REWARD_NOT_USABLE));
    }

    @Test
    @DisplayName("rejects a voucher not owned by the caller")
    void voucher_notOwned_throws() {
        User u = user(UUID.randomUUID());
        UUID rewardId = UUID.randomUUID();
        when(memberRewardRepository.findByIdAndUserId(rewardId, u.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.redeemVoucherForBooking(
                u, rewardId, new BigDecimal("15.00"), new BigDecimal("200.00"), UUID.randomUUID()))
                .isInstanceOf(TravelAiException.class)
                .satisfies(ex -> assertThat(((TravelAiException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.REWARD_NOT_USABLE));
    }
}
