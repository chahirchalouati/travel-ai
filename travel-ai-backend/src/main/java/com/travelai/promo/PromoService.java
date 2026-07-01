package com.travelai.promo;

import com.travelai.promo.dto.PromoValidationResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PromoService {

    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final PromoCodeRepository promoCodeRepository;

    /**
     * Validate a promo code against an order amount without recording a redemption.
     * Returns an invalid response with a human-readable message when the code
     * cannot be applied; only malformed input throws.
     */
    @Transactional(readOnly = true)
    public PromoValidationResponse validate(String code, BigDecimal amount) {
        if (code == null || code.isBlank()) {
            throw TravelAiException.badRequest(ErrorCode.PROMO_CODE_INVALID);
        }
        if (amount == null || amount.signum() < 0) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }

        String normalized = code.trim();
        Optional<PromoCode> found = promoCodeRepository.findByCodeIgnoreCase(normalized);
        if (found.isEmpty()) {
            return invalid(normalized, amount, "This promo code does not exist.");
        }

        PromoCode promo = found.get();
        if (!promo.isActive()) {
            return invalid(normalized, amount, "This promo code is no longer active.");
        }
        if (promo.getExpiresAt() != null && promo.getExpiresAt().isBefore(Instant.now())) {
            return invalid(normalized, amount, "This promo code has expired.");
        }
        if (promo.getMaxRedemptions() != null && promo.getTimesRedeemed() >= promo.getMaxRedemptions()) {
            return invalid(normalized, amount, "This promo code has reached its redemption limit.");
        }

        BigDecimal discount = computeDiscount(promo, amount);
        BigDecimal finalAmount = amount.subtract(discount).max(BigDecimal.ZERO);
        return new PromoValidationResponse(true, promo.getCode(), scale(discount), scale(finalAmount),
                "Promo code applied.");
    }

    private BigDecimal computeDiscount(PromoCode promo, BigDecimal amount) {
        BigDecimal discount = switch (promo.getDiscountType()) {
            case PERCENT -> amount.multiply(promo.getValue()).divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
            case FIXED -> promo.getValue().min(amount);
        };
        return discount.max(BigDecimal.ZERO);
    }

    private PromoValidationResponse invalid(String code, BigDecimal amount, String message) {
        return new PromoValidationResponse(false, code, BigDecimal.ZERO, scale(amount), message);
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
