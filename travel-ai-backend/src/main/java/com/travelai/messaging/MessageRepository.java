package com.travelai.messaging;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    /** All messages across several conversations in one query, for list previews. */
    List<Message> findByConversationIdInOrderByCreatedAtAsc(List<UUID> conversationIds);
}
