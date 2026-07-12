package com.travelai.audit;

import com.travelai.audit.dto.AuditLogResponse;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> list(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            Pageable pageable) {
        Page<AuditLogResponse> page = auditService.search(actor, action, pageable);
        ApiResponse.Meta meta = new ApiResponse.Meta(page.getTotalElements(), page.getNumber(), page.getSize());
        return ResponseEntity.ok(ApiResponse.ok(page, meta));
    }
}
