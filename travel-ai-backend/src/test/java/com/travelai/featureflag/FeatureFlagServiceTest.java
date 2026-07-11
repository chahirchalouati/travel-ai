package com.travelai.featureflag;

import com.travelai.featureflag.dto.FeatureFlagResponse;
import com.travelai.featureflag.dto.FeatureFlagUpsertRequest;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeatureFlagServiceTest {

    @Mock
    private FeatureFlagRepository repository;

    @InjectMocks
    private FeatureFlagService service;

    @Test
    @DisplayName("isEnabled returns false for unknown keys")
    void isEnabledUnknownKey() {
        when(repository.findByKey("missing")).thenReturn(Optional.empty());
        assertThat(service.isEnabled("missing")).isFalse();
    }

    @Test
    @DisplayName("enabledFlags returns a key->true map of only enabled flags")
    void enabledFlagsMap() {
        when(repository.findByEnabledTrue()).thenReturn(List.of(
                FeatureFlag.builder().key("new_checkout").enabled(true).build()));
        assertThat(service.enabledFlags()).containsEntry("new_checkout", true).hasSize(1);
    }

    @Test
    @DisplayName("upsert creates a new flag when the key is unseen")
    void upsertCreates() {
        var req = new FeatureFlagUpsertRequest("beta_maps", true, "Beta map view");
        when(repository.findByKey("beta_maps")).thenReturn(Optional.empty());
        when(repository.save(any(FeatureFlag.class))).thenAnswer(i -> i.getArgument(0));

        FeatureFlagResponse res = service.upsert(req);

        assertThat(res.key()).isEqualTo("beta_maps");
        assertThat(res.enabled()).isTrue();
    }

    @Test
    @DisplayName("setEnabled throws when the flag is missing")
    void setEnabledMissing() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.setEnabled(id, true)).isInstanceOf(TravelAiException.class);
    }
}
