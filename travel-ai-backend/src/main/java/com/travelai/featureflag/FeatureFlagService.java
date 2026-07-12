package com.travelai.featureflag;

import com.travelai.featureflag.dto.FeatureFlagResponse;
import com.travelai.featureflag.dto.FeatureFlagUpsertRequest;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeatureFlagService {

    private final FeatureFlagRepository repository;

    /** True only when a flag exists and is enabled. Safe default (off) for unknown keys. */
    @Transactional(readOnly = true)
    public boolean isEnabled(String key) {
        return repository.findByKey(key).map(FeatureFlag::isEnabled).orElse(false);
    }

    /** Public map of enabled flags for anonymous callers: { key: true }. */
    @Transactional(readOnly = true)
    public Map<String, Boolean> enabledFlags() {
        return enabledFlagsFor(null, null);
    }

    /**
     * Effective flags for a specific caller, honouring role targeting and percentage rollout.
     * @param userKey stable per-user seed (e.g. email); null for anonymous
     * @param role    the caller's role (e.g. "TRAVELER"); null for anonymous
     */
    @Transactional(readOnly = true)
    public Map<String, Boolean> enabledFlagsFor(String userKey, String role) {
        return repository.findByEnabledTrue().stream()
                .filter(f -> evaluate(f, userKey, role))
                .collect(Collectors.toMap(FeatureFlag::getKey, f -> true));
    }

    /** Decides whether a single flag applies to the given caller. */
    boolean evaluate(FeatureFlag flag, String userKey, String role) {
        if (!flag.isEnabled()) {
            return false;
        }
        if (!roleAllowed(flag.getTargetRoles(), role)) {
            return false;
        }
        return withinRollout(flag.getKey(), flag.getRolloutPercentage(), userKey);
    }

    private boolean roleAllowed(String targetRoles, String role) {
        if (targetRoles == null || targetRoles.isBlank()) {
            return true;
        }
        if (role == null || role.isBlank()) {
            return false;
        }
        for (String allowed : targetRoles.split(",")) {
            if (allowed.trim().equalsIgnoreCase(role.trim())) {
                return true;
            }
        }
        return false;
    }

    private boolean withinRollout(String key, int rolloutPercentage, String userKey) {
        if (rolloutPercentage >= 100) {
            return true;
        }
        if (rolloutPercentage <= 0) {
            return false;
        }
        if (userKey == null || userKey.isBlank()) {
            // No stable seed → treat partial rollouts as off for anonymous callers.
            return false;
        }
        int bucket = Math.floorMod((key + ':' + userKey).hashCode(), 100);
        return bucket < rolloutPercentage;
    }

    @Transactional(readOnly = true)
    public List<FeatureFlagResponse> list() {
        return repository.findAllByOrderByKeyAsc().stream().map(FeatureFlagResponse::from).toList();
    }

    /** Create a new flag or update the existing one with the same key. */
    @Transactional
    public FeatureFlagResponse upsert(FeatureFlagUpsertRequest req) {
        String key = req.key().trim();
        FeatureFlag flag = repository.findByKey(key).orElseGet(() -> FeatureFlag.builder().key(key).build());
        flag.setEnabled(req.enabled());
        flag.setDescription(req.description());
        flag.setRolloutPercentage(clampRollout(req.rolloutPercentage()));
        flag.setTargetRoles(normalizeRoles(req.targetRoles()));
        flag.setGroupName(req.groupName() == null || req.groupName().isBlank() ? null : req.groupName().trim());
        flag.setUpdatedAt(Instant.now());
        return FeatureFlagResponse.from(repository.save(flag));
    }

    @Transactional
    public FeatureFlagResponse setEnabled(UUID id, boolean enabled) {
        FeatureFlag flag = repository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.FEATURE_FLAG_NOT_FOUND));
        flag.setEnabled(enabled);
        flag.setUpdatedAt(Instant.now());
        return FeatureFlagResponse.from(repository.save(flag));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw TravelAiException.notFound(ErrorCode.FEATURE_FLAG_NOT_FOUND);
        }
        repository.deleteById(id);
    }

    private static int clampRollout(Integer value) {
        if (value == null) {
            return 100;
        }
        return Math.max(0, Math.min(100, value));
    }

    /** Trims/uppercases the comma-separated role list, dropping blanks; null when empty. */
    private static String normalizeRoles(String targetRoles) {
        if (targetRoles == null || targetRoles.isBlank()) {
            return null;
        }
        String normalized = java.util.Arrays.stream(targetRoles.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .distinct()
                .collect(Collectors.joining(","));
        return normalized.isBlank() ? null : normalized;
    }
}
