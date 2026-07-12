package com.travelai.user;

import com.travelai.shared.domain.ApiResponse;
import com.travelai.user.dto.PhotoRequest;
import com.travelai.user.dto.PhotoResponse;
import com.travelai.user.dto.PlaceRequest;
import com.travelai.user.dto.PlaceResponse;
import com.travelai.user.dto.UpdateProfileMediaRequest;
import com.travelai.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * User-authored profile content. Maps to {@code /api/users/me/...} via the path prefix.
 */
@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class ProfileContentController {

    private final ProfileContentService service;

    @PatchMapping("/media")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMedia(
            Authentication auth, @Valid @RequestBody UpdateProfileMediaRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateMedia(auth.getName(), request)));
    }

    @GetMapping("/places")
    public ResponseEntity<ApiResponse<List<PlaceResponse>>> listPlaces(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.listPlaces(auth.getName())));
    }

    @PostMapping("/places")
    public ResponseEntity<ApiResponse<PlaceResponse>> addPlace(
            Authentication auth, @Valid @RequestBody PlaceRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.addPlace(auth.getName(), request)));
    }

    @PutMapping("/places/{id}")
    public ResponseEntity<ApiResponse<PlaceResponse>> updatePlace(
            Authentication auth, @PathVariable UUID id, @Valid @RequestBody PlaceRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updatePlace(auth.getName(), id, request)));
    }

    @DeleteMapping("/places/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlace(Authentication auth, @PathVariable UUID id) {
        service.deletePlace(auth.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/photos")
    public ResponseEntity<ApiResponse<List<PhotoResponse>>> listPhotos(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.listPhotos(auth.getName())));
    }

    @PostMapping("/photos")
    public ResponseEntity<ApiResponse<PhotoResponse>> addPhoto(
            Authentication auth, @Valid @RequestBody PhotoRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.addPhoto(auth.getName(), request)));
    }

    @DeleteMapping("/photos/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(Authentication auth, @PathVariable UUID id) {
        service.deletePhoto(auth.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
