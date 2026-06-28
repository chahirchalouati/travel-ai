package com.travelai.ai.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, UUID> {

    List<ChatConversation> findByUserIdAndActiveTrueOrderByUpdatedAtDesc(UUID userId);
}
