package com.travelai.pricewatch;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.catalog.cruise.CruiseService;
import com.travelai.catalog.flight.FlightService;
import com.travelai.catalog.flight.dto.FlightSearchResult;
import com.travelai.notification.events.PriceDropEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PriceWatchService.checkAll")
class PriceWatchServiceTest {

    @Mock private PriceWatchRepository repository;
    @Mock private UserRepository userRepository;
    @Mock private FlightService flightService;
    @Mock private CruiseService cruiseService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private PriceWatchService service;

    private static FlightSearchResult flightAt(UUID id, String price) {
        return new FlightSearchResult(id, "AZ", "AZ100", "FCO", "MXP",
                Instant.now(), Instant.now().plusSeconds(3600),
                new BigDecimal(price), (short) 20, true,
                "Rome", "Italy", "Milan", "Italy", "IT");
    }

    private PriceWatch watchAt(String baseline, UUID flightId) {
        User user = mock(User.class);
        lenient().when(user.getId()).thenReturn(UUID.randomUUID());
        lenient().when(user.getEmail()).thenReturn("watcher@example.com");
        PriceWatch w = new PriceWatch();
        w.setUser(user);
        w.setFlightId(flightId);
        w.setLabel("FCO → MXP");
        w.setLastPrice(new BigDecimal(baseline));
        w.setActive(true);
        return w;
    }

    @Test
    @DisplayName("fires a PriceDropEvent and re-baselines when the price drops")
    void checkAll_priceDrop_publishesEvent() {
        UUID flightId = UUID.randomUUID();
        PriceWatch w = watchAt("89.00", flightId);
        when(repository.findByActiveTrue()).thenReturn(List.of(w));
        when(flightService.getById(flightId)).thenReturn(flightAt(flightId, "59.00"));

        service.checkAll();

        ArgumentCaptor<PriceDropEvent> event = ArgumentCaptor.forClass(PriceDropEvent.class);
        verify(eventPublisher).publishEvent(event.capture());
        assertThat(event.getValue().oldPrice()).isEqualByComparingTo("89.00");
        assertThat(event.getValue().newPrice()).isEqualByComparingTo("59.00");
        assertThat(w.getLastPrice()).isEqualByComparingTo("59.00");
        assertThat(w.getLastNotifiedPrice()).isEqualByComparingTo("59.00");
        verify(repository).save(w);
    }

    @Test
    @DisplayName("does not fire when the price is unchanged")
    void checkAll_noDrop_doesNotPublish() {
        UUID flightId = UUID.randomUUID();
        PriceWatch w = watchAt("89.00", flightId);
        when(repository.findByActiveTrue()).thenReturn(List.of(w));
        when(flightService.getById(flightId)).thenReturn(flightAt(flightId, "89.00"));

        service.checkAll();

        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("respects a target price: no alert until the price reaches the threshold")
    void checkAll_aboveTarget_doesNotPublish() {
        UUID flightId = UUID.randomUUID();
        PriceWatch w = watchAt("89.00", flightId);
        w.setTargetPrice(new BigDecimal("50.00"));
        when(repository.findByActiveTrue()).thenReturn(List.of(w));
        when(flightService.getById(flightId)).thenReturn(flightAt(flightId, "59.00"));

        service.checkAll();

        // dropped 89 -> 59 but still above the 50 target, so no alert
        verify(eventPublisher, never()).publishEvent(any());
        assertThat(w.getLastPrice()).isEqualByComparingTo("59.00");
    }
}
