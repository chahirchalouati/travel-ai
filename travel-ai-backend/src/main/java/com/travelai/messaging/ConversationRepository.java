package com.travelai.messaging;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    List<Conversation> findByUserIdOrderByLastMessageAtDesc(UUID userId);

    long countByUserIdAndUnreadForUserTrue(UUID userId);
}
