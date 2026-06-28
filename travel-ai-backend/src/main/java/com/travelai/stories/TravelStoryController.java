package com.travelai.stories;

import com.travelai.shared.domain.ApiResponse;
import com.travelai.stories.dto.TravelStoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/stories")
@RequiredArgsConstructor
public class TravelStoryController {

    private final TravelStoryRepository travelStoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TravelStoryResponse>>> getStories() {
        List<TravelStoryResponse> stories = travelStoryRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(stories));
    }

    private TravelStoryResponse toResponse(TravelStory story) {
        return new TravelStoryResponse(
                story.getId(),
                story.getPlace(),
                story.getCountry(),
                story.getTag(),
                story.getMinutes(),
                story.getPosterUrl(),
                story.getVideoUrl(),
                story.isFeatured()
        );
    }
}
