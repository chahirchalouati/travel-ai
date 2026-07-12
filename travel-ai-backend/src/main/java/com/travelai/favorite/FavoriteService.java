package com.travelai.favorite;

import com.travelai.favorite.dto.AddFavoriteRequest;
import com.travelai.favorite.dto.FavoriteResponse;
import com.travelai.favorite.dto.ToggleResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    @Transactional(readOnly = true)
    public List<FavoriteResponse> listFavorites(UUID userId, String entityType) {
        List<Favorite> favorites = (entityType != null && !entityType.isBlank())
                ? favoriteRepository.findByUserIdAndEntityTypeOrderByCreatedAtDesc(
                        userId, entityType.toUpperCase())
                : favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return favorites.stream().map(FavoriteResponse::from).toList();
    }

    @Transactional
    public FavoriteResponse addFavorite(UUID userId, AddFavoriteRequest req) {
        String type = req.entityType().toUpperCase();

        if (favoriteRepository.existsByUserIdAndEntityTypeAndEntityId(userId, type, req.entityId())) {
            return favoriteRepository
                    .findByUserIdAndEntityTypeAndEntityId(userId, type, req.entityId())
                    .map(FavoriteResponse::from)
                    .orElseThrow();
        }

        Favorite favorite = Favorite.builder()
                .userId(userId)
                .entityType(type)
                .entityId(req.entityId())
                .title(req.title())
                .subtitle(req.subtitle())
                .imageUrl(req.imageUrl())
                .route(req.route())
                .build();

        return FavoriteResponse.from(favoriteRepository.save(favorite));
    }

    @Transactional
    public void removeFavorite(UUID userId, String entityType, String entityId) {
        favoriteRepository.deleteByUserIdAndEntityTypeAndEntityId(
                userId, entityType.toUpperCase(), entityId);
    }

    /**
     * Adds the item if absent, removes it if present. Returns the new favorited
     * state and, when newly added, the persisted favorite.
     */
    @Transactional
    public ToggleResponse toggle(UUID userId, AddFavoriteRequest req) {
        String type = req.entityType().toUpperCase();
        boolean exists = favoriteRepository.existsByUserIdAndEntityTypeAndEntityId(
                userId, type, req.entityId());
        if (exists) {
            favoriteRepository.deleteByUserIdAndEntityTypeAndEntityId(userId, type, req.entityId());
            return new ToggleResponse(false, null);
        }
        FavoriteResponse saved = addFavorite(userId, req);
        return new ToggleResponse(true, saved);
    }

    @Transactional(readOnly = true)
    public boolean isFavorited(UUID userId, String entityType, String entityId) {
        return favoriteRepository.existsByUserIdAndEntityTypeAndEntityId(
                userId, entityType.toUpperCase(), entityId);
    }
}
