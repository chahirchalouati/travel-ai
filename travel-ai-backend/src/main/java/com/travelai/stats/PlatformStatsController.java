package com.travelai.stats;

import com.travelai.destination.DestinationRepository;
import com.travelai.review.ReviewRepository;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class PlatformStatsController {

    private final DestinationRepository destinationRepository;
    private final ReviewRepository reviewRepository;

    @GetMapping
    public ApiResponse<PlatformStats> getStats() {
        long destinationCount = destinationRepository.count();
        long reviewCount = reviewRepository.count();
        return ApiResponse.ok(new PlatformStats(destinationCount, reviewCount));
    }

    public record PlatformStats(long destinationCount, long reviewCount) {}
}
