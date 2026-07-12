package com.travelai.stats;

import com.travelai.auth.UserRepository;
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
    private final UserRepository userRepository;

    @GetMapping
    public ApiResponse<PlatformStats> getStats() {
        long destinationCount = destinationRepository.count();
        long reviewCount = reviewRepository.count();
        long countryCount = destinationRepository.countDistinctCountries();
        long travelerCount = userRepository.count();
        double avgRating = reviewRepository.findGlobalAverageRating()
                .map(r -> Math.round(r * 10.0) / 10.0)
                .orElse(0.0);
        return ApiResponse.ok(new PlatformStats(
                destinationCount, reviewCount, countryCount, travelerCount, avgRating));
    }

    public record PlatformStats(
            long destinationCount,
            long reviewCount,
            long countryCount,
            long travelerCount,
            double avgRating) {}
}
