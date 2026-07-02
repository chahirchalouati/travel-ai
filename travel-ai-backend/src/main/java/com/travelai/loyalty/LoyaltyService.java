package com.travelai.loyalty;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.loyalty.dto.LoyaltySummaryResponse;
import com.travelai.loyalty.dto.LoyaltyTransactionResponse;
import com.travelai.loyalty.dto.RedeemPreviewResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class LoyaltyService {

    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    /**
     * Awards points for a completed payment: floor(amount × tier multiplier),
     * credited to both the spendable and lifetime balances, then re-tiers the
     * account. Creates the account lazily on first earn.
     */
    public void awardForPayment(UUID userId, UUID bookingId, BigDecimal amountPaid) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
        LoyaltyAccount account = getOrCreateAccount(user);

        int earned = LoyaltyRules.earnedPoints(amountPaid, account.getTier());
        if (earned <= 0) {
            return;
        }

        account.setPointsBalance(account.getPointsBalance() + earned);
        account.setLifetimePoints(account.getLifetimePoints() + earned);
        account.setTier(LoyaltyTier.fromLifetimePoints(account.getLifetimePoints()));
        accountRepository.save(account);

        recordTransaction(account, LoyaltyTransactionType.EARN, earned, bookingId,
                "Points earned on payment of EUR " + amountPaid);
        log.info("Loyalty: user {} earned {} pts (tier {})", userId, earned, account.getTier());
    }

    /**
     * Spends points against a booking being created. The request's
     * {@code totalAmount} — like the promo discount — already has the points
     * discount subtracted by the client, so the 50%-of-total cap is enforced as
     * discount ≤ remaining (net) total. Deducts the points and writes a REDEEM
     * ledger entry; throws 400 when any rule is violated so the enclosing
     * booking transaction rolls back.
     */
    public BigDecimal redeemForBooking(User user, int points, BigDecimal netTotalAmount, UUID bookingId) {
        if (points < LoyaltyRules.MIN_REDEEM_POINTS) {
            throw TravelAiException.badRequest(ErrorCode.LOYALTY_REDEEM_INVALID);
        }
        LoyaltyAccount account = accountRepository.findByUserId(user.getId())
                .orElseThrow(() -> TravelAiException.badRequest(ErrorCode.LOYALTY_REDEEM_INVALID));
        if (account.getPointsBalance() < points) {
            throw TravelAiException.badRequest(ErrorCode.LOYALTY_REDEEM_INVALID);
        }

        BigDecimal discount = LoyaltyRules.discountFor(points);
        // discount ≤ net total ⇔ discount ≤ 50% of the pre-discount total
        if (netTotalAmount == null || discount.compareTo(netTotalAmount) > 0) {
            throw TravelAiException.badRequest(ErrorCode.LOYALTY_REDEEM_INVALID);
        }

        account.setPointsBalance(account.getPointsBalance() - points);
        accountRepository.save(account);

        recordTransaction(account, LoyaltyTransactionType.REDEEM, -points, bookingId,
                "Points redeemed for EUR " + discount + " booking discount");
        log.info("Loyalty: user {} redeemed {} pts (EUR {}) on booking {}",
                user.getId(), points, discount, bookingId);
        return discount;
    }

    @Transactional(readOnly = true)
    public LoyaltySummaryResponse summary(String userEmail) {
        LoyaltyAccount account = accountRepository.findByUserEmail(userEmail).orElse(null);
        int balance = account != null ? account.getPointsBalance() : 0;
        int lifetime = account != null ? account.getLifetimePoints() : 0;
        LoyaltyTier tier = account != null ? account.getTier() : LoyaltyTier.EXPLORER;
        LoyaltyTier next = tier.next();

        List<LoyaltyTransactionResponse> recent = account == null
                ? List.of()
                : transactionRepository.findTop20ByAccountIdOrderByCreatedAtDesc(account.getId())
                        .stream().map(LoyaltyTransactionResponse::from).toList();

        return new LoyaltySummaryResponse(
                balance,
                lifetime,
                tier.name(),
                next != null ? next.name() : null,
                next != null ? next.getMinLifetimePoints() - lifetime : null,
                tier.getEarnMultiplier(),
                recent);
    }

    /**
     * Previews a redemption against a booking total without spending anything.
     * When {@code points} is given its discount is returned if it satisfies the
     * rules; otherwise the maximum redeemable discount is quoted.
     */
    @Transactional(readOnly = true)
    public RedeemPreviewResponse redeemPreview(String userEmail, BigDecimal amount, Integer points) {
        if (amount == null || amount.signum() < 0) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }
        int balance = accountRepository.findByUserEmail(userEmail)
                .map(LoyaltyAccount::getPointsBalance)
                .orElse(0);
        int max = LoyaltyRules.maxRedeemablePoints(amount, balance);

        int quoted = points != null ? points : max;
        boolean valid = quoted >= LoyaltyRules.MIN_REDEEM_POINTS && quoted <= max;
        BigDecimal discount = valid ? LoyaltyRules.discountFor(quoted) : BigDecimal.ZERO;
        return new RedeemPreviewResponse(max, discount);
    }

    private LoyaltyAccount getOrCreateAccount(User user) {
        return accountRepository.findByUserId(user.getId())
                .orElseGet(() -> accountRepository.save(
                        LoyaltyAccount.builder().user(user).build()));
    }

    private void recordTransaction(LoyaltyAccount account, LoyaltyTransactionType type,
                                   int points, UUID bookingId, String description) {
        transactionRepository.save(LoyaltyTransaction.builder()
                .account(account)
                .type(type)
                .points(points)
                .bookingId(bookingId)
                .description(description)
                .build());
    }
}
