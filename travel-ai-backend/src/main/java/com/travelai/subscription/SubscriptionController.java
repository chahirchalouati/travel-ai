package com.travelai.subscription;

import com.travelai.shared.domain.ApiResponse;
import com.travelai.subscription.dto.MembershipResponse;
import com.travelai.subscription.dto.SubscribeRequest;
import com.travelai.subscription.dto.SubscriptionPlanResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    /** Public: the sellable plans (used by the /membership landing page). */
    @GetMapping("/plans")
    public ApiResponse<List<SubscriptionPlanResponse>> plans() {
        return ApiResponse.ok(subscriptionService.plans());
    }

    @GetMapping("/me")
    public ApiResponse<MembershipResponse> me(@AuthenticationPrincipal UserDetails user) {
        return ApiResponse.ok(subscriptionService.membership(user.getUsername()));
    }

    @PostMapping("/subscribe")
    public ApiResponse<MembershipResponse> subscribe(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody @Valid SubscribeRequest req) {
        return ApiResponse.ok(subscriptionService.subscribe(user.getUsername(), req.planCode()));
    }

    @PostMapping("/cancel")
    public ApiResponse<MembershipResponse> cancel(@AuthenticationPrincipal UserDetails user) {
        return ApiResponse.ok(subscriptionService.cancel(user.getUsername()));
    }
}
