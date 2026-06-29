package com.travelai.admin;

import com.travelai.admin.dto.*;
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

    @PostMapping("/partners")
    public ResponseEntity<ApiResponse<AdminPartnerResponse>> createPartner(
            @Valid @RequestBody AdminPartnerUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.createPartner(request)));
    }

    @PutMapping("/partners/{id}")
    public ResponseEntity<ApiResponse<AdminPartnerResponse>> updatePartner(
            @PathVariable UUID id, @Valid @RequestBody AdminPartnerUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.updatePartner(id, request)));
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

    @PatchMapping("/bookings/{id}/status")
    public ResponseEntity<ApiResponse<AdminBookingResponse>> updateBookingStatus(
            @PathVariable UUID id, @Valid @RequestBody UpdateBookingStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.updateBookingStatus(id, request.status())));
    }

    @GetMapping("/ai-logs")
    public ResponseEntity<ApiResponse<Page<AdminAiLogResponse>>> listAiLogs(Pageable pageable) {
        Page<AdminAiLogResponse> page = adminService.listAiLogs(pageable);
        ApiResponse.Meta meta = new ApiResponse.Meta(page.getTotalElements(), page.getNumber(), page.getSize());
        return ResponseEntity.ok(ApiResponse.ok(page, meta));
    }

    // ── User management ───────────────────────────────────────────────────

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<AdminUserResponse>> createUser(
            @Valid @RequestBody AdminUserUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.createUser(request)));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUser(
            @PathVariable UUID id, @Valid @RequestBody AdminUserUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.updateUser(id, request)));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserRole(
            @PathVariable UUID id, @Valid @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.updateUserRole(id, request.role())));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable UUID id, @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.setUserActive(id, request.active())));
    }

    // ── Review moderation ─────────────────────────────────────────────────

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<Page<AdminReviewResponse>>> listReviews(Pageable pageable) {
        Page<AdminReviewResponse> page = adminService.listReviews(pageable);
        ApiResponse.Meta meta = new ApiResponse.Meta(page.getTotalElements(), page.getNumber(), page.getSize());
        return ResponseEntity.ok(ApiResponse.ok(page, meta));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable UUID id) {
        adminService.deleteReview(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
