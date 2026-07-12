package com.travelai.favorite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<Favorite, UUID>, JpaSpecificationExecutor<Favorite> {

    List<Favorite> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Favorite> findByUserIdAndEntityTypeOrderByCreatedAtDesc(UUID userId, String entityType);

    Optional<Favorite> findByUserIdAndEntityTypeAndEntityId(UUID userId, String entityType, String entityId);

    boolean existsByUserIdAndEntityTypeAndEntityId(UUID userId, String entityType, String entityId);

    void deleteByUserIdAndEntityTypeAndEntityId(UUID userId, String entityType, String entityId);
}
