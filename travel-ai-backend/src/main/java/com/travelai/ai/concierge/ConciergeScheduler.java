package com.travelai.ai.concierge;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ConciergeScheduler {

    private final ConciergeService conciergeService;

    @Scheduled(cron = "0 0 8 * * *")
    public void activateConciergeForUpcomingDepartures() {
        log.info("ConciergeScheduler: checking departures in 3 days");
        try {
            var upcoming = conciergeService.findUpcomingDepartures();
            log.info("ConciergeScheduler: found {} upcoming departures", upcoming.size());
        } catch (Exception e) {
            log.error("ConciergeScheduler failed", e);
        }
    }
}
