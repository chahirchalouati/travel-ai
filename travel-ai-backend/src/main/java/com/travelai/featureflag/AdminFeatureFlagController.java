package com.travelai.featureflag;

import com.travelai.featureflag.dto.FeatureFlagResponse;
import com.travelai.featureflag.dto.FeatureFlagUpsertRequest;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/feature-flags")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeatureFlagController {

    private final FeatureFlagService featureFlagService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeatureFlagResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(featureFlagService.list()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> upsert(
            @Valid @RequestBody FeatureFlagUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(featureFlagService.upsert(request)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> toggle(
            @PathVariable UUID id, @RequestBody Map<String, Boolean> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        return ResponseEntity.ok(ApiResponse.ok(featureFlagService.setEnabled(id, enabled)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        featureFlagService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
