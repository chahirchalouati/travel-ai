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

    /** Public map of enabled flags for the frontend: { key: true }. */
    @Transactional(readOnly = true)
    public Map<String, Boolean> enabledFlags() {
        return repository.findByEnabledTrue().stream()
                .collect(Collectors.toMap(FeatureFlag::getKey, FeatureFlag::isEnabled));
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
}
