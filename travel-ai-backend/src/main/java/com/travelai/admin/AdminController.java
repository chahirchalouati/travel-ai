package com.travelai.admin;

import com.travelai.admin.dto.*;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getDashboard()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> listUsers(Pageable pageable) {
        Page<AdminUserResponse> page = adminService.listUsers(pageable);
        ApiResponse.Meta meta = new ApiResponse.Meta(page.getTotalElements(), page.getNumber(), page.getSize());
        return ResponseEntity.ok(ApiResponse.ok(page, meta));
    }

    @GetMapping("/partners")
    public ResponseEntity<ApiResponse<Page<AdminPartnerResponse>>> listPartners(Pageable pageable) {
        Page<AdminPartnerResponse> page = adminService.listPartners(pageable);
        ApiResponse.Meta meta = new ApiResponse.Meta(page.getTotalElements(), page.getNumber(), page.getSize());
        return ResponseEntity.ok(ApiResponse.ok(page, meta));
    }

    @PatchMapping("/partners/{id}/activate")
    public ResponseEntity<Void> activatePartner(@PathVariable UUID id) {
        adminService.activatePartner(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/partners/{id}/suspend")
    public ResponseEntity<Void> suspendPartner(@PathVariable UUID id) {
        adminService.suspendPartner(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<Page<AdminBookingResponse>>> listBookings(Pageable pageable) {
        Page<AdminBookingResponse> page = adminService.listBookings(pageable);
        ApiResponse.Meta meta = new ApiResponse.Meta(page.getTotalElements(), page.getNumber(), page.getSize());
        return ResponseEntity.ok(ApiResponse.ok(page, meta));
    }

    @GetMapping("/ai-logs")
    public ResponseEntity<ApiResponse<Page<AdminAiLogResponse>>> listAiLogs(Pageable pageable) {
        Page<AdminAiLogResponse> page = adminService.listAiLogs(pageable);
        ApiResponse.Meta meta = new ApiResponse.Meta(page.getTotalElements(), page.getNumber(), page.getSize());
        return ResponseEntity.ok(ApiResponse.ok(page, meta));
    }
}
