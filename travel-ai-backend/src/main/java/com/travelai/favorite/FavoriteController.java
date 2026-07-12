package com.travelai.favorite;

import com.travelai.auth.User;
import com.travelai.favorite.dto.AddFavoriteRequest;
import com.travelai.favorite.dto.FavoriteResponse;
import com.travelai.favorite.dto.ToggleResponse;
import com.travelai.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * Lists the authenticated user's favorites. Optionally filtered by entityType
     * query param (e.g. ?entityType=HOTEL).
     */
    @GetMapping
    public ApiResponse<List<FavoriteResponse>> listFavorites(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String entityType) {
        return ApiResponse.ok(favoriteService.listFavorites(resolveId(user), entityType));
    }

    /** Adds a catalog item to the user's favorites. Idempotent — re-adding is a no-op. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FavoriteResponse> addFavorite(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody AddFavoriteRequest req) {
        return ApiResponse.ok(favoriteService.addFavorite(resolveId(user), req));
    }

    /** Removes a specific favorite. Returns 204 whether or not the entry existed. */
    @DeleteMapping("/{entityType}/{entityId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFavorite(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String entityType,
            @PathVariable String entityId) {
        favoriteService.removeFavorite(resolveId(user), entityType, entityId);
    }

    /**
     * Toggles a favorite: adds if absent, removes if present. Useful for
     * heart-button components that call a single endpoint.
     */
    @PostMapping("/toggle")
    public ApiResponse<ToggleResponse> toggleFavorite(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody AddFavoriteRequest req) {
        return ApiResponse.ok(favoriteService.toggle(resolveId(user), req));
    }

    /** Returns whether a specific item is in the user's favorites. */
    @GetMapping("/{entityType}/{entityId}")
    public ApiResponse<Boolean> isFavorited(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String entityType,
            @PathVariable String entityId) {
        return ApiResponse.ok(favoriteService.isFavorited(resolveId(user), entityType, entityId));
    }

    private static java.util.UUID resolveId(UserDetails user) {
        if (!(user instanceof User travelUser)) {
            throw new IllegalStateException("Unexpected principal type: " + user.getClass().getName());
        }
        return travelUser.getId();
    }
}
