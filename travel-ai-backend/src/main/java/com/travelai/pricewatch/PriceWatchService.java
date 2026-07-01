package com.travelai.pricewatch;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.catalog.cruise.CruiseService;
import com.travelai.catalog.cruise.dto.CruiseSearchResult;
import com.travelai.catalog.flight.FlightService;
import com.travelai.catalog.flight.dto.FlightSearchResult;
import com.travelai.notification.events.PriceDropEvent;
import com.travelai.pricewatch.dto.CreatePriceWatchRequest;
import com.travelai.pricewatch.dto.PriceWatchResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Lets a user watch a flight or cruise and get alerted when its price drops.
 * {@link #checkAll()} is run periodically by {@link PriceWatchScheduler}.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PriceWatchService {

    private final PriceWatchRepository repository;
    private final UserRepository userRepository;
    private final FlightService flightService;
    private final CruiseService cruiseService;
    private final ApplicationEventPublisher eventPublisher;

    public PriceWatchResponse create(String email, CreatePriceWatchRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));

        if (req.flightId() == null && req.cruiseId() == null) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }

        // Idempotent: return the existing watch for the same item if present.
        Optional<PriceWatch> existing = req.flightId() != null
                ? repository.findByUserEmailAndFlightId(email, req.flightId())
                : repository.findByUserEmailAndCruiseId(email, req.cruiseId());
        if (existing.isPresent()) {
            return PriceWatchResponse.from(existing.get());
        }

        PriceWatch watch = new PriceWatch();
        watch.setUser(user);
        watch.setTargetPrice(req.targetPrice());
        watch.setActive(true);

        if (req.flightId() != null) {
            FlightSearchResult f = flightService.getById(req.flightId());
            watch.setFlightId(f.id());
            watch.setLabel(f.originIata() + " → " + f.destIata());
            watch.setLastPrice(f.price());
        } else {
            CruiseSearchResult c = cruiseService.getById(req.cruiseId());
            watch.setCruiseId(c.id());
            watch.setLabel(c.name());
            watch.setLastPrice(c.pricePerPerson());
        }

        return PriceWatchResponse.from(repository.save(watch));
    }

    @Transactional(readOnly = true)
    public List<PriceWatchResponse> listMine(String email) {
        return repository.findByUserEmailOrderByCreatedAtDesc(email).stream()
                .map(PriceWatchResponse::from)
                .toList();
    }

    public void delete(String email, UUID id) {
        PriceWatch watch = repository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PRICE_WATCH_NOT_FOUND));
        repository.delete(watch);
    }

    /**
     * Re-prices every active watch. When the current price is below the baseline
     * (and any target threshold), fires a {@link PriceDropEvent} once per new low
     * and re-baselines. Missing catalog items are skipped, not fatal.
     */
    public void checkAll() {
        List<PriceWatch> watches = repository.findByActiveTrue();
        for (PriceWatch w : watches) {
            currentPrice(w).ifPresent(current -> evaluate(w, current));
        }
    }

    private void evaluate(PriceWatch w, BigDecimal current) {
        BigDecimal baseline = w.getLastPrice();
        boolean dropped = current.compareTo(baseline) < 0;
        boolean underTarget = w.getTargetPrice() == null || current.compareTo(w.getTargetPrice()) <= 0;
        boolean newLow = w.getLastNotifiedPrice() == null || current.compareTo(w.getLastNotifiedPrice()) < 0;

        if (dropped && underTarget && newLow) {
            w.setLastNotifiedPrice(current);
            eventPublisher.publishEvent(new PriceDropEvent(
                    w.getId(), w.getUser().getId(), w.getUser().getEmail(),
                    w.getLabel(), baseline, current));
            log.info("Price drop on watch {} ({}): {} -> {}", w.getId(), w.getLabel(), baseline, current);
        }
        w.setLastPrice(current);
        repository.save(w);
    }

    private Optional<BigDecimal> currentPrice(PriceWatch w) {
        try {
            if (w.getFlightId() != null) {
                return Optional.of(flightService.getById(w.getFlightId()).price());
            }
            if (w.getCruiseId() != null) {
                return Optional.of(cruiseService.getById(w.getCruiseId()).pricePerPerson());
            }
        } catch (TravelAiException ex) {
            log.debug("Watched item gone for watch {} — skipping", w.getId());
        }
        return Optional.empty();
    }
}
