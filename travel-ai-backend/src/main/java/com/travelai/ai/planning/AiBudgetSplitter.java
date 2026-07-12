package com.travelai.ai.planning;

import com.travelai.shared.domain.SpendingPriority;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Component
public class AiBudgetSplitter {

    // [hotel, restaurant, flight] weights
    private static final Map<SpendingPriority, BigDecimal[]> WEIGHTS = Map.of(
            SpendingPriority.STAY, new BigDecimal[]{new BigDecimal("0.55"), new BigDecimal("0.15"), new BigDecimal("0.30")},
            SpendingPriority.FOOD, new BigDecimal[]{new BigDecimal("0.30"), new BigDecimal("0.40"), new BigDecimal("0.30")},
            SpendingPriority.BALANCED, new BigDecimal[]{new BigDecimal("0.40"), new BigDecimal("0.25"), new BigDecimal("0.35")}
    );

    public BigDecimal[] split(BigDecimal total, SpendingPriority priority) {
        BigDecimal[] w = WEIGHTS.get(priority);
        return new BigDecimal[]{
                total.multiply(w[0]).setScale(2, RoundingMode.HALF_UP),
                total.multiply(w[1]).setScale(2, RoundingMode.HALF_UP),
                total.multiply(w[2]).setScale(2, RoundingMode.HALF_UP)
        };
    }
}
