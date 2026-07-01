package com.travelai.pricewatch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Periodically re-prices active price watches and fires drop alerts. */
@Component
@RequiredArgsConstructor
@Slf4j
public class PriceWatchScheduler {

    private final PriceWatchService priceWatchService;

    @Scheduled(
            initialDelayString = "${travelai.price-watch.initial-delay-ms:30000}",
            fixedRateString = "${travelai.price-watch.interval-ms:120000}")
    public void run() {
        try {
            priceWatchService.checkAll();
        } catch (RuntimeException ex) {
            log.warn("Price-watch check failed", ex);
        }
    }
}
