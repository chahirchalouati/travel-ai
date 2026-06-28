package com.travelai.ai.chat;

import com.travelai.ai.chat.dto.*;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ApiResponse<ChatResponse> chat(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody ChatRequest request) {
        return ApiResponse.ok(chatService.chat(user.getUsername(), request));
    }

    @GetMapping("/conversations")
    public ApiResponse<List<ConversationResponse>> getConversations(
            @AuthenticationPrincipal UserDetails user) {
        return ApiResponse.ok(chatService.getConversations(user.getUsername()));
    }

    @GetMapping("/conversations/{id}")
    public ApiResponse<ConversationDetailResponse> getConversation(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        return ApiResponse.ok(chatService.getConversation(user.getUsername(), id));
    }

    @DeleteMapping("/conversations/{id}")
    public ApiResponse<Void> deleteConversation(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        chatService.deleteConversation(user.getUsername(), id);
        return ApiResponse.ok(null);
    }
}
