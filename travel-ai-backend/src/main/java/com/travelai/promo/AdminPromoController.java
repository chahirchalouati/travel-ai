package com.travelai.promo;

import com.travelai.promo.dto.AdminPromoResponse;
import com.travelai.promo.dto.AdminPromoUpsertRequest;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/promos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromoController {

    private final PromoService promoService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminPromoResponse>>> list(Pageable pageable) {
        Page<AdminPromoResponse> page = promoService.list(pageable);
        ApiResponse.Meta meta = new ApiResponse.Meta(page.getTotalElements(), page.getNumber(), page.getSize());
        return ResponseEntity.ok(ApiResponse.ok(page, meta));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminPromoResponse>> create(
            @Valid @RequestBody AdminPromoUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(promoService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminPromoResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody AdminPromoUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(promoService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        promoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
