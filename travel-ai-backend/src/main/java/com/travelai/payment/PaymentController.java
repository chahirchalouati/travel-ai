package com.travelai.payment;

import com.travelai.payment.dto.InitiatePaymentRequest;
import com.travelai.payment.dto.PaymentResponse;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentResponse> initiate(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody @Valid InitiatePaymentRequest req) {
        return ApiResponse.ok(paymentService.initiatePayment(user.getUsername(), req));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<PaymentResponse> confirm(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        return ApiResponse.ok(paymentService.confirmPayment(user.getUsername(), id));
    }

    @PostMapping("/{id}/refund")
    public ApiResponse<PaymentResponse> refund(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        return ApiResponse.ok(paymentService.refundPayment(user.getUsername(), id));
    }

    @GetMapping
    public ApiResponse<Page<PaymentResponse>> list(
            @AuthenticationPrincipal UserDetails user,
            Pageable pageable) {
        return ApiResponse.ok(paymentService.getMyPayments(user.getUsername(), pageable));
    }
}
