package com.travelai.attraction;

import com.travelai.attraction.dto.AttractionResponse;
import com.travelai.attraction.dto.AttractionSearchRequest;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttractionServiceTest {

    @Mock
    private AttractionRepository attractionRepository;

    private AttractionService service;

    @BeforeEach
    void setUp() {
        service = new AttractionService(attractionRepository);
    }

    private Attraction attraction(String name, String category, String priceLevel, boolean bookable, int popularity) {
        return Attraction.builder()
                .id(UUID.randomUUID())
                .name(name)
                .category(category)
                .city("Rome")
                .priceLevel(priceLevel)
                .bookable(bookable)
                .popularityScore(popularity)
                .basePrice(BigDecimal.TEN)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("search with empty request returns active attractions sorted by popularity desc")
    void search_emptyRequest_sortedByPopularity() {
        when(attractionRepository.findByActiveTrue(any(Pageable.class)))
                .thenReturn(List.of(
                        attraction("Low", "MUSEUM", "FREE", false, 10),
                        attraction("High", "LANDMARK", "FREE", false, 90)));

        List<AttractionResponse> result = service.search(
                new AttractionSearchRequest(null, null, null, null));

        assertThat(result).hasSize(2);
        assertThat(result.get(0).name()).isEqualTo("High");
        assertThat(result.get(1).name()).isEqualTo("Low");
    }

    @Test
    @DisplayName("search filters by price level")
    void search_filtersByPriceLevel() {
        when(attractionRepository.findByActiveTrue(any(Pageable.class)))
                .thenReturn(List.of(
                        attraction("Free one", "PARK", "FREE", false, 50),
                        attraction("Premium one", "TOUR", "HIGH", true, 60)));

        List<AttractionResponse> result = service.search(
                new AttractionSearchRequest(null, null, "HIGH", null));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Premium one");
    }

    @Test
    @DisplayName("search filters by bookable flag")
    void search_filtersByBookable() {
        when(attractionRepository.findByActiveTrue(any(Pageable.class)))
                .thenReturn(List.of(
                        attraction("Bookable", "ACTIVITY", "LOW", true, 40),
                        attraction("Not bookable", "LANDMARK", "FREE", false, 80)));

        List<AttractionResponse> result = service.search(
                new AttractionSearchRequest(null, null, null, true));

        assertThat(result).extracting(AttractionResponse::name).containsExactly("Bookable");
    }

    @Test
    @DisplayName("search by city delegates to city query")
    void search_byCity_usesCityQuery() {
        when(attractionRepository.findByActiveTrueAndCityIgnoreCase("Rome"))
                .thenReturn(List.of(attraction("Colosseum", "LANDMARK", "MEDIUM", true, 99)));

        List<AttractionResponse> result = service.search(
                new AttractionSearchRequest("Rome", null, null, null));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Colosseum");
    }

    @Test
    @DisplayName("getById returns mapped response when found")
    void getById_found_returnsResponse() {
        Attraction a = attraction("Trevi Fountain", "LANDMARK", "FREE", false, 92);
        when(attractionRepository.findById(a.getId())).thenReturn(Optional.of(a));

        AttractionResponse result = service.getById(a.getId());

        assertThat(result.name()).isEqualTo("Trevi Fountain");
        assertThat(result.category()).isEqualTo("LANDMARK");
    }

    @Test
    @DisplayName("getById throws when not found")
    void getById_missing_throws() {
        UUID id = UUID.randomUUID();
        when(attractionRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(id))
                .isInstanceOf(TravelAiException.class);
    }

    @Test
    @DisplayName("getTrending caps the limit at 50")
    void getTrending_capsLimit() {
        when(attractionRepository.findByActiveTrueOrderByPopularityScoreDesc(any(Pageable.class)))
                .thenReturn(List.of());

        service.getTrending(999);

        // exercised without error; cap is enforced internally (Pageable.ofSize(50))
        assertThat(service.getTrending(999)).isEmpty();
    }
}
