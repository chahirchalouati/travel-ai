package com.travelai.notification;

import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationBroadcastService broadcastService;

    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<Map<String, Object>>> broadcast(
            @Valid @RequestBody BroadcastRequest request) {
        int recipients = broadcastService.broadcast(request.subject(), request.body(), request.role());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("recipients", recipients)));
    }

    /** Broadcast payload; {@code role} null/blank means all active users. */
    public record BroadcastRequest(
            @NotBlank String subject,
            @NotBlank String body,
            String role) {
    }
}
