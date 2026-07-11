package com.travelai.loyalty;

import com.travelai.loyalty.dto.LoyaltySummaryResponse;
import com.travelai.loyalty.dto.MemberRewardResponse;
import com.travelai.loyalty.dto.RedeemPreviewRequest;
import com.travelai.loyalty.dto.RedeemPreviewResponse;
import com.travelai.loyalty.dto.RewardResponse;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;
    private final LoyaltyRewardService rewardService;

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

    /** The rewards catalogue, annotated with what the caller has unlocked / can redeem. */
    @GetMapping("/rewards")
    public ApiResponse<List<RewardResponse>> rewards(@AuthenticationPrincipal UserDetails user) {
        return ApiResponse.ok(rewardService.catalogue(user.getUsername()));
    }

    /** The rewards the caller owns. */
    @GetMapping("/rewards/me")
    public ApiResponse<List<MemberRewardResponse>> myRewards(@AuthenticationPrincipal UserDetails user) {
        return ApiResponse.ok(rewardService.myRewards(user.getUsername()));
    }

    /** Claims a redeemable reward by spending points. */
    @PostMapping("/rewards/{code}/redeem")
    public ApiResponse<MemberRewardResponse> redeemReward(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String code) {
        return ApiResponse.ok(rewardService.redeem(user.getUsername(), code));
    }
}
