package com.travelai.media;

import com.travelai.media.dto.MediaUploadResponse;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Authenticated media uploads. Maps to {@code /api/media} via the global path prefix.
 */
@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {

    private final StorageService storageService;

    /**
     * POST /api/media — uploads an image to the given folder and returns its public URL.
     *
     * @param file   multipart image (jpeg/png/webp/gif/avif, max 10 MB)
     * @param folder destination: avatars | covers | gallery | stories | content
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<MediaUploadResponse>> upload(
            Authentication auth,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "gallery") String folder) {
        var stored = storageService.upload(file, folder);
        return ResponseEntity.ok(ApiResponse.ok(MediaUploadResponse.from(stored)));
    }
}
