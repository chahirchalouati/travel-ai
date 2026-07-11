package com.travelai.promo;

import com.travelai.promo.dto.AdminPromoResponse;
import com.travelai.promo.dto.AdminPromoUpsertRequest;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class PromoServiceAdminTest {

    @Mock
    private PromoCodeRepository repository;

    @InjectMocks
    private PromoService service;

    @Test
    @DisplayName("create persists a new active promo code")
    void createPersists() {
        var req = new AdminPromoUpsertRequest("SUMMER25", "PERCENT", new BigDecimal("25"), null, null, 100);
        when(repository.findByCodeIgnoreCase("SUMMER25")).thenReturn(Optional.empty());
        when(repository.save(any(PromoCode.class))).thenAnswer(i -> i.getArgument(0));

        AdminPromoResponse res = service.create(req);

        assertThat(res.code()).isEqualTo("SUMMER25");
        assertThat(res.discountType()).isEqualTo("PERCENT");
        assertThat(res.active()).isTrue();
        verify(repository).save(any(PromoCode.class));
    }

    @Test
    @DisplayName("create rejects a duplicate code")
    void createRejectsDuplicate() {
        var req = new AdminPromoUpsertRequest("DUP", "FIXED", BigDecimal.TEN, true, null, null);
        when(repository.findByCodeIgnoreCase("DUP")).thenReturn(Optional.of(new PromoCode()));

        assertThatThrownBy(() -> service.create(req)).isInstanceOf(TravelAiException.class);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("update throws when the promo code is missing")
    void updateMissing() {
        UUID id = UUID.randomUUID();
        var req = new AdminPromoUpsertRequest("X", "FIXED", BigDecimal.ONE, true, null, null);
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(id, req)).isInstanceOf(TravelAiException.class);
    }

    @Test
    @DisplayName("delete throws when the promo code is missing")
    void deleteMissing() {
        UUID id = UUID.randomUUID();
        when(repository.existsById(id)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(id)).isInstanceOf(TravelAiException.class);
        verify(repository, never()).deleteById(any());
    }
}
