package com.travelai.attraction;

import com.travelai.attraction.dto.AttractionResponse;
import com.travelai.attraction.dto.AttractionSearchRequest;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AttractionService {

    private static final int FEATURED_BROWSE_LIMIT = 200;

    private final AttractionRepository attractionRepository;

    /**
     * Filters active attractions by city / category / price level / bookable.
     * Empty request → all active attractions ranked by popularity (browse mode).
     */
    public List<AttractionResponse> search(AttractionSearchRequest request) {
        List<Attraction> candidates = candidatesFor(request);

        return candidates.stream()
                .filter(a -> request.priceLevel() == null
                        || request.priceLevel().equalsIgnoreCase(a.getPriceLevel()))
                .filter(a -> request.bookable() == null
                        || request.bookable() == a.isBookable())
                .sorted((x, y) -> Integer.compare(y.getPopularityScore(), x.getPopularityScore()))
                .map(AttractionResponse::from)
                .toList();
    }

    public AttractionResponse getById(UUID id) {
        Attraction attraction = attractionRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.ATTRACTION_NOT_FOUND));
        return AttractionResponse.from(attraction);
    }

    public List<AttractionResponse> getFeatured() {
        return attractionRepository.findByActiveTrueAndFeaturedTrueOrderByPopularityScoreDesc()
                .stream().map(AttractionResponse::from).toList();
    }

    public List<AttractionResponse> getTrending(int limit) {
        int safeLimit = limit <= 0 ? 10 : Math.min(limit, 50);
        return attractionRepository.findByActiveTrueOrderByPopularityScoreDesc(Pageable.ofSize(safeLimit))
                .stream().map(AttractionResponse::from).toList();
    }

    /** Distinct categories with at least one active attraction (for filter chips). */
    public List<String> getCategories() {
        return attractionRepository.findDistinctCategories();
    }

    // --- private helpers ---

    private List<Attraction> candidatesFor(AttractionSearchRequest request) {
        boolean hasCity = request.city() != null && !request.city().isBlank();
        boolean hasCategory = request.category() != null && !request.category().isBlank();

        if (hasCity && hasCategory) {
            return attractionRepository
                    .findByActiveTrueAndCityIgnoreCaseAndCategoryIgnoreCase(request.city(), request.category());
        }
        if (hasCity) {
            return attractionRepository.findByActiveTrueAndCityIgnoreCase(request.city());
        }
        if (hasCategory) {
            return attractionRepository.findByActiveTrueAndCategoryIgnoreCase(request.category());
        }
        return attractionRepository.findByActiveTrue(Pageable.ofSize(FEATURED_BROWSE_LIMIT));
    }
}
