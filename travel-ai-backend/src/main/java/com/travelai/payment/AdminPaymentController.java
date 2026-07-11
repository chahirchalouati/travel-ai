package com.travelai.payment;

import com.travelai.payment.dto.AdminPaymentResponse;
import com.travelai.shared.domain.ApiResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminPaymentResponse>>> list(
            @RequestParam(required = false) String status,
            Pageable pageable) {
        PaymentStatus filter = parseStatus(status);
        Page<AdminPaymentResponse> page = paymentService.adminList(filter, pageable);
        ApiResponse.Meta meta = new ApiResponse.Meta(page.getTotalElements(), page.getNumber(), page.getSize());
        return ResponseEntity.ok(ApiResponse.ok(page, meta));
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<ApiResponse<AdminPaymentResponse>> refund(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.adminRefund(id)));
    }

    private PaymentStatus parseStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        try {
            return PaymentStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }
    }
}
