package com.travelai.revenue;

import com.travelai.revenue.dto.RevenueSummaryResponse;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin-only revenue dashboard endpoint. */
@RestController
@RequestMapping("/admin/revenue")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRevenueController {

    private final RevenueService revenueService;

    @GetMapping("/summary")
    public ApiResponse<RevenueSummaryResponse> summary() {
        return ApiResponse.ok(revenueService.summary());
    }
}
