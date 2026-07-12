package com.travelai.partner;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.partner.dto.ConfigurePartnerRequest;
import com.travelai.partner.dto.PartnerResponse;
import com.travelai.partner.dto.PartnerSummaryResponse;
import com.travelai.partner.dto.RegisterPartnerRequest;
import com.travelai.shared.domain.ApiResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/partners")
@RequiredArgsConstructor
public class PartnerController {

    private final PartnerService partnerService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PartnerResponse>> register(
            @Valid @RequestBody RegisterPartnerRequest request,
            Authentication authentication) {
        User user = resolveUser(authentication);
        PartnerResponse response = partnerService.register(request, user);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/configuration")
    public ResponseEntity<ApiResponse<PartnerResponse>> configure(
            @PathVariable UUID id,
            @Valid @RequestBody ConfigurePartnerRequest request) {
        PartnerResponse response = partnerService.configure(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/validate")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'ADMIN')")
    public ResponseEntity<ApiResponse<PartnerResponse>> validate(@PathVariable UUID id) {
        PartnerResponse response = partnerService.validate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/go-live")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'ADMIN')")
    public ResponseEntity<ApiResponse<PartnerResponse>> goLive(@PathVariable UUID id) {
        PartnerResponse response = partnerService.goLive(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> suspend(@PathVariable UUID id) {
        partnerService.suspend(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PartnerResponse>> getById(@PathVariable UUID id) {
        PartnerResponse response = partnerService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PartnerSummaryResponse>>> list(
            @RequestParam(required = false) PartnerType type,
            Pageable pageable) {
        Page<PartnerSummaryResponse> page = type != null
                ? partnerService.listByType(type, pageable)
                : partnerService.listAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    private User resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
    }
}
