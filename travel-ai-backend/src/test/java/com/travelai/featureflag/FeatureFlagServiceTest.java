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
        var req = new FeatureFlagUpsertRequest("beta_maps", true, "Beta map view", 50, "partner, admin", "Growth");
        when(repository.findByKey("beta_maps")).thenReturn(Optional.empty());
        when(repository.save(any(FeatureFlag.class))).thenAnswer(i -> i.getArgument(0));

        FeatureFlagResponse res = service.upsert(req);

        assertThat(res.key()).isEqualTo("beta_maps");
        assertThat(res.enabled()).isTrue();
        assertThat(res.rolloutPercentage()).isEqualTo(50);
        assertThat(res.targetRoles()).isEqualTo("PARTNER,ADMIN");   // normalized
        assertThat(res.groupName()).isEqualTo("Growth");
    }

    // ── Evaluation (role targeting + percentage rollout) ────────────────────

    private FeatureFlag flag(boolean enabled, int rollout, String roles) {
        return FeatureFlag.builder().key("beta.feature").enabled(enabled)
                .rolloutPercentage(rollout).targetRoles(roles).build();
    }

    @Test
    @DisplayName("evaluate: disabled flag never applies")
    void evaluateDisabled() {
        assertThat(service.evaluate(flag(false, 100, null), "jane@x.com", "TRAVELER")).isFalse();
    }

    @Test
    @DisplayName("evaluate: full rollout, no targeting applies to everyone incl. anonymous")
    void evaluateFullRollout() {
        assertThat(service.evaluate(flag(true, 100, null), null, null)).isTrue();
        assertThat(service.evaluate(flag(true, 100, null), "jane@x.com", "TRAVELER")).isTrue();
    }

    @Test
    @DisplayName("evaluate: role targeting only lets matching roles through")
    void evaluateRoleTargeting() {
        FeatureFlag f = flag(true, 100, "PARTNER,ADMIN");
        assertThat(service.evaluate(f, "p@x.com", "PARTNER")).isTrue();
        assertThat(service.evaluate(f, "a@x.com", "admin")).isTrue();     // case-insensitive
        assertThat(service.evaluate(f, "t@x.com", "TRAVELER")).isFalse();
        assertThat(service.evaluate(f, null, null)).isFalse();           // anonymous blocked
    }

    @Test
    @DisplayName("evaluate: rollout 0 is off; partial rollout is off for anonymous and deterministic per user")
    void evaluateRollout() {
        assertThat(service.evaluate(flag(true, 0, null), "jane@x.com", "TRAVELER")).isFalse();
        FeatureFlag partial = flag(true, 50, null);
        assertThat(service.evaluate(partial, null, null)).isFalse();
        assertThat(service.evaluate(partial, "stable@x.com", "TRAVELER"))
                .isEqualTo(service.evaluate(partial, "stable@x.com", "TRAVELER"));
    }

    @Test
    @DisplayName("setEnabled throws when the flag is missing")
    void setEnabledMissing() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.setEnabled(id, true)).isInstanceOf(TravelAiException.class);
    }
}
