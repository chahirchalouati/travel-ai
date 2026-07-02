package com.travelai.loyalty;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
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
@DisplayName("LoyaltyService")
class LoyaltyServiceTest {

    @Mock private LoyaltyAccountRepository accountRepository;
    @Mock private LoyaltyTransactionRepository transactionRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private LoyaltyService service;

    private static User user(UUID id) {
        User u = mock(User.class);
        lenient().when(u.getId()).thenReturn(id);
        return u;
    }

    private static LoyaltyAccount account(User user, int balance, int lifetime, LoyaltyTier tier) {
        return LoyaltyAccount.builder()
                .user(user)
                .pointsBalance(balance)
                .lifetimePoints(lifetime)
                .tier(tier)
                .build();
    }

    // --- awardForPayment ----------------------------------------------------

    @Test
    @DisplayName("awards floored points at the current tier multiplier and records an EARN transaction")
    void award_earnsWithTierMultiplier() {
        UUID userId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();
        User u = user(userId);
        LoyaltyAccount acc = account(u, 100, 1_200, LoyaltyTier.VOYAGER);
        when(userRepository.findById(userId)).thenReturn(Optional.of(u));
        when(accountRepository.findByUserId(userId)).thenReturn(Optional.of(acc));

        service.awardForPayment(userId, bookingId, new BigDecimal("10.99"));

        // floor(10.99 × 1.25) = 13
        assertThat(acc.getPointsBalance()).isEqualTo(113);
        assertThat(acc.getLifetimePoints()).isEqualTo(1_213);
        ArgumentCaptor<LoyaltyTransaction> tx = ArgumentCaptor.forClass(LoyaltyTransaction.class);
        verify(transactionRepository).save(tx.capture());
        assertThat(tx.getValue().getType()).isEqualTo(LoyaltyTransactionType.EARN);
        assertThat(tx.getValue().getPoints()).isEqualTo(13);
        assertThat(tx.getValue().getBookingId()).isEqualTo(bookingId);
    }

    @Test
    @DisplayName("creates the account lazily on first earn")
    void award_createsAccountLazily() {
        UUID userId = UUID.randomUUID();
        User u = user(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(u));
        when(accountRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.awardForPayment(userId, null, new BigDecimal("250.00"));

        // new EXPLORER account earns 1x
        ArgumentCaptor<LoyaltyAccount> saved = ArgumentCaptor.forClass(LoyaltyAccount.class);
        verify(accountRepository, atLeastOnce()).save(saved.capture());
        LoyaltyAccount acc = saved.getValue();
        assertThat(acc.getPointsBalance()).isEqualTo(250);
        assertThat(acc.getLifetimePoints()).isEqualTo(250);
        assertThat(acc.getTier()).isEqualTo(LoyaltyTier.EXPLORER);
    }

    @Test
    @DisplayName("promotes the tier when lifetime points cross a threshold")
    void award_promotesTier() {
        UUID userId = UUID.randomUUID();
        User u = user(userId);
        LoyaltyAccount acc = account(u, 950, 950, LoyaltyTier.EXPLORER);
        when(userRepository.findById(userId)).thenReturn(Optional.of(u));
        when(accountRepository.findByUserId(userId)).thenReturn(Optional.of(acc));

        service.awardForPayment(userId, null, new BigDecimal("100.00"));

        // 950 + 100 (EXPLORER 1x) = 1050 lifetime → VOYAGER
        assertThat(acc.getLifetimePoints()).isEqualTo(1_050);
        assertThat(acc.getTier()).isEqualTo(LoyaltyTier.VOYAGER);
    }

    @Test
    @DisplayName("earn multiplier uses the tier held before the payment")
    void award_usesPrePaymentTier() {
        UUID userId = UUID.randomUUID();
        User u = user(userId);
        LoyaltyAccount acc = account(u, 0, 4_990, LoyaltyTier.VOYAGER);
        when(userRepository.findById(userId)).thenReturn(Optional.of(u));
        when(accountRepository.findByUserId(userId)).thenReturn(Optional.of(acc));

        service.awardForPayment(userId, null, new BigDecimal("100.00"));

        // earns at VOYAGER 1.25x = 125, then crosses into ELITE
        assertThat(acc.getPointsBalance()).isEqualTo(125);
        assertThat(acc.getTier()).isEqualTo(LoyaltyTier.ELITE);
    }

    @Test
    @DisplayName("does nothing when the paid amount rounds to zero points")
    void award_zeroPointsIsNoOp() {
        UUID userId = UUID.randomUUID();
        User u = user(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(u));
        when(accountRepository.findByUserId(userId))
                .thenReturn(Optional.of(account(u, 5, 5, LoyaltyTier.EXPLORER)));

        service.awardForPayment(userId, null, new BigDecimal("0.50"));

        verify(transactionRepository, never()).save(any());
    }

    // --- redeemForBooking -----------------------------------------------------

    @Test
    @DisplayName("rejects redemptions under the 500-point minimum")
    void redeem_belowMinimum_throws() {
        assertThatThrownBy(() ->
                service.redeemForBooking(user(UUID.randomUUID()), 499, new BigDecimal("100.00"), null))
                .isInstanceOf(TravelAiException.class)
                .hasMessageContaining("redemption");
        verifyNoInteractions(transactionRepository);
    }

    @Test
    @DisplayName("rejects redemptions exceeding the balance")
    void redeem_insufficientBalance_throws() {
        User u = user(UUID.randomUUID());
        when(accountRepository.findByUserId(u.getId()))
                .thenReturn(Optional.of(account(u, 600, 600, LoyaltyTier.EXPLORER)));

        assertThatThrownBy(() ->
                service.redeemForBooking(u, 700, new BigDecimal("100.00"), null))
                .isInstanceOf(TravelAiException.class);
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("rejects a discount above 50% of the total (discount > net remainder)")
    void redeem_overCap_throws() {
        User u = user(UUID.randomUUID());
        when(accountRepository.findByUserId(u.getId()))
                .thenReturn(Optional.of(account(u, 20_000, 20_000, LoyaltyTier.ELITE)));

        // 6000 pts = 60 EUR against a 100 EUR pre-discount booking: client would send
        // net 40 EUR, and 60 > 40 violates the 50% cap.
        assertThatThrownBy(() ->
                service.redeemForBooking(u, 6_000, new BigDecimal("40.00"), null))
                .isInstanceOf(TravelAiException.class);
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("rejects users without a loyalty account")
    void redeem_noAccount_throws() {
        User u = user(UUID.randomUUID());
        when(accountRepository.findByUserId(u.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.redeemForBooking(u, 500, new BigDecimal("100.00"), null))
                .isInstanceOf(TravelAiException.class);
    }

    @Test
    @DisplayName("valid redemption deducts points and records a negative REDEEM transaction")
    void redeem_happyPath() {
        User u = user(UUID.randomUUID());
        UUID bookingId = UUID.randomUUID();
        LoyaltyAccount acc = account(u, 2_000, 2_000, LoyaltyTier.VOYAGER);
        when(accountRepository.findByUserId(u.getId())).thenReturn(Optional.of(acc));

        // 1000 pts = 10 EUR against 90 EUR net (100 EUR pre-discount) — within all rules
        BigDecimal discount = service.redeemForBooking(u, 1_000, new BigDecimal("90.00"), bookingId);

        assertThat(discount).isEqualByComparingTo("10.00");
        assertThat(acc.getPointsBalance()).isEqualTo(1_000);
        // lifetime points are never reduced by redemption
        assertThat(acc.getLifetimePoints()).isEqualTo(2_000);
        ArgumentCaptor<LoyaltyTransaction> tx = ArgumentCaptor.forClass(LoyaltyTransaction.class);
        verify(transactionRepository).save(tx.capture());
        assertThat(tx.getValue().getType()).isEqualTo(LoyaltyTransactionType.REDEEM);
        assertThat(tx.getValue().getPoints()).isEqualTo(-1_000);
        assertThat(tx.getValue().getBookingId()).isEqualTo(bookingId);
    }

    // --- redeemPreview ---------------------------------------------------------

    @Test
    @DisplayName("preview quotes the max redeemable points and their discount")
    void preview_quotesMax() {
        LoyaltyAccount acc = account(user(UUID.randomUUID()), 10_000, 10_000, LoyaltyTier.ELITE);
        when(accountRepository.findByUserEmail("a@b.c")).thenReturn(Optional.of(acc));

        var res = service.redeemPreview("a@b.c", new BigDecimal("100.00"), null);

        assertThat(res.maxRedeemablePoints()).isEqualTo(5_000); // 50% cap
        assertThat(res.discountAmount()).isEqualByComparingTo("50.00");
    }

    @Test
    @DisplayName("preview returns zero discount when requested points break the rules")
    void preview_invalidPointsGiveZeroDiscount() {
        LoyaltyAccount acc = account(user(UUID.randomUUID()), 400, 400, LoyaltyTier.EXPLORER);
        when(accountRepository.findByUserEmail("a@b.c")).thenReturn(Optional.of(acc));

        var res = service.redeemPreview("a@b.c", new BigDecimal("100.00"), 400);

        assertThat(res.maxRedeemablePoints()).isZero(); // balance under the 500 minimum
        assertThat(res.discountAmount()).isEqualByComparingTo("0");
    }
}
