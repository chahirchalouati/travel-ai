package com.travelai.notification;

import com.travelai.auth.UserRepository;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private static final int MAX_PAGE_SIZE = 100;

    private final NotificationLogRepository notificationLogRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ApiResponse<Page<NotificationView>> list(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID userId = userRepository.findByEmail(user.getUsername())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"))
                .getId();

        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<NotificationView> notifications = notificationLogRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationView::from);

        return ApiResponse.ok(notifications);
    }
}
