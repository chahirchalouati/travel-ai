package com.travelai.loyalty;

import com.travelai.loyalty.dto.LoyaltySummaryResponse;
import com.travelai.loyalty.dto.RedeemPreviewRequest;
import com.travelai.loyalty.dto.RedeemPreviewResponse;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping
    public ApiResponse<LoyaltySummaryResponse> summary(@AuthenticationPrincipal UserDetails user) {
        return ApiResponse.ok(loyaltyService.summary(user.getUsername()));
    }

    @PostMapping("/redeem-preview")
    public ApiResponse<RedeemPreviewResponse> redeemPreview(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody @Valid RedeemPreviewRequest req) {
        return ApiResponse.ok(loyaltyService.redeemPreview(user.getUsername(), req.amount(), req.points()));
    }
}
