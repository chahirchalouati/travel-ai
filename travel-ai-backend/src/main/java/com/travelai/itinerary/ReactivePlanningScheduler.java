package com.travelai.itinerary;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodic maintenance for the reactive itinerary: expires stale proposals and
 * ticks the watch timestamp on active itineraries. External disruption detection
 * is delivered through {@link ItineraryWebhookController}, not synthetic polling.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReactivePlanningScheduler {

    private final LiveItineraryService liveItineraryService;

    /** Expire proposals past their approval window every 15 minutes. */
    @Scheduled(cron = "0 */15 * * * *")
    public void expireProposals() {
        int expired = liveItineraryService.expireStaleProposals();
        if (expired > 0) {
            log.info("Expired {} stale itinerary proposal(s)", expired);
        }
    }

    /** Tick watched itineraries every 30 minutes. */
    @Scheduled(cron = "0 */30 * * * *")
    public void pollWatched() {
        int checked = liveItineraryService.touchWatchedItineraries();
        log.debug("Reactive poll touched {} watched itinerary(ies)", checked);
    }
}
