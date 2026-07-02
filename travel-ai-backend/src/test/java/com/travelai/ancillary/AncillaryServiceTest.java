package com.travelai.ancillary;

import com.travelai.ancillary.dto.AncillarySelection;
import com.travelai.ancillary.dto.ResolvedAncillary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AncillaryServiceTest {

    @Mock
    private AncillaryOptionRepository optionRepository;

    private AncillaryService service;

    @BeforeEach
    void setUp() {
        service = new AncillaryService(optionRepository);
    }

    private AncillaryOption option(String code, String vertical, BigDecimal price, boolean active) {
        AncillaryOption o = new AncillaryOption();
        o.setCode(code);
        o.setLabel(code + " label");
        o.setVertical(vertical);
        o.setPrice(price);
        o.setCurrency("EUR");
        o.setActive(active);
        return o;
    }

    @Test
    @DisplayName("listForVertical returns vertical-agnostic options plus matching-vertical options")
    void listForVertical_filtersByVertical() {
        when(optionRepository.findByActiveTrueOrderBySortOrderAsc()).thenReturn(List.of(
                option("INSURANCE", null, new BigDecimal("19.90"), true),
                option("BAGGAGE", "flight", new BigDecimal("29.90"), true),
                option("WINE", "restaurant", new BigDecimal("24.90"), true)));

        var flightOptions = service.listForVertical("flight");

        assertThat(flightOptions).extracting("code").containsExactlyInAnyOrder("INSURANCE", "BAGGAGE");
    }

    @Test
    @DisplayName("resolve prices selections with the catalogue price, ignoring any client price")
    void resolve_usesServerAuthoritativePrice() {
        when(optionRepository.findByCodeIgnoreCase("BAGGAGE"))
                .thenReturn(Optional.of(option("BAGGAGE", "flight", new BigDecimal("29.90"), true)));

        List<ResolvedAncillary> resolved = service.resolve(List.of(new AncillarySelection("BAGGAGE", 2)));

        assertThat(resolved).hasSize(1);
        assertThat(resolved.get(0).unitPrice()).isEqualByComparingTo("29.90");
        assertThat(resolved.get(0).quantity()).isEqualTo(2);
        assertThat(resolved.get(0).lineTotal()).isEqualByComparingTo("59.80");
    }

    @Test
    @DisplayName("resolve skips unknown or inactive codes")
    void resolve_skipsUnknownAndInactive() {
        when(optionRepository.findByCodeIgnoreCase("GHOST")).thenReturn(Optional.empty());
        when(optionRepository.findByCodeIgnoreCase("OLD"))
                .thenReturn(Optional.of(option("OLD", null, new BigDecimal("5.00"), false)));

        List<ResolvedAncillary> resolved = service.resolve(List.of(
                new AncillarySelection("GHOST", 1),
                new AncillarySelection("OLD", 1)));

        assertThat(resolved).isEmpty();
    }

    @Test
    @DisplayName("resolve clamps quantity to at least 1 and at most the max")
    void resolve_clampsQuantity() {
        lenient().when(optionRepository.findByCodeIgnoreCase("SEAT"))
                .thenReturn(Optional.of(option("SEAT", "flight", new BigDecimal("14.90"), true)));

        var zero = service.resolve(List.of(new AncillarySelection("SEAT", 0)));
        var huge = service.resolve(List.of(new AncillarySelection("SEAT", 999)));

        assertThat(zero.get(0).quantity()).isEqualTo(1);
        assertThat(huge.get(0).quantity()).isEqualTo(20);
    }

    @Test
    @DisplayName("resolve returns empty list for null/empty selections")
    void resolve_handlesEmpty() {
        assertThat(service.resolve(null)).isEmpty();
        assertThat(service.resolve(List.of())).isEmpty();
    }
}
