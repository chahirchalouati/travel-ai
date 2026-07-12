package com.travelai.messaging;

import com.travelai.messaging.dto.ConversationResponse;
import com.travelai.messaging.dto.SendMessageRequest;
import com.travelai.messaging.dto.StartConversationRequest;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Maps to {@code /api/messages} via the global path prefix. */
@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService messagingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> list(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(messagingService.listConversations(auth.getName())));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unread(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", messagingService.unreadCount(auth.getName()))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationResponse>> thread(
            Authentication auth, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(messagingService.getThread(auth.getName(), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> start(
            Authentication auth, @Valid @RequestBody StartConversationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                messagingService.start(auth.getName(), request.subject(), request.body())));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<ConversationResponse>> reply(
            Authentication auth, @PathVariable UUID id, @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                messagingService.reply(auth.getName(), id, request.body())));
    }
}
