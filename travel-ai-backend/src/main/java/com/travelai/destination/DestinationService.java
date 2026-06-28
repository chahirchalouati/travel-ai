package com.travelai.destination;

import com.travelai.destination.dto.DestinationGuide;
import com.travelai.destination.dto.DestinationResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DestinationService {

    private final DestinationRepository destinationRepository;
    private final ChatClient chatClient;

    public Page<DestinationResponse> getAll(int page, int size) {
        return destinationRepository.findByActiveTrue(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public List<DestinationResponse> getFeatured() {
        return destinationRepository.findByFeaturedTrueAndActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    public DestinationResponse getById(UUID id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.DESTINATION_NOT_FOUND));
        return toResponse(destination);
    }

    public Page<DestinationResponse> search(String query, int page, int size) {
        return destinationRepository.searchByNameOrCountry(query, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public List<DestinationResponse> getByContinent(String continent) {
        return destinationRepository.findByContinentIgnoreCaseAndActiveTrue(continent).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<DestinationResponse> getTrending(int limit) {
        return destinationRepository.findByActiveTrueOrderByPopularityScoreDesc(PageRequest.of(0, limit))
                .map(this::toResponse)
                .getContent();
    }

    public DestinationGuide generateGuide(UUID id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.DESTINATION_NOT_FOUND));

        String prompt = "Generate a comprehensive travel guide for %s, %s. Include: "
                + "1) Top 5 attractions 2) Must-try local foods 3) Essential travel tips. "
                + "Be specific, enthusiastic and helpful. Max 300 words."
                        .formatted(destination.getName(), destination.getCountry());

        log.info("Generating AI travel guide for destination: {}", destination.getName());

        String content = chatClient.prompt(prompt).call().content();

        return parseGuide(destination.getId(), destination.getName(), content);
    }

    private DestinationGuide parseGuide(UUID destinationId, String name, String content) {
        String topAttractions = extractSection(content, "Top 5 attractions", "Must-try local foods");
        String foodRecommendations = extractSection(content, "Must-try local foods", "Essential travel tips");
        String travelTips = extractSection(content, "Essential travel tips", null);

        return new DestinationGuide(destinationId, name, content, topAttractions, foodRecommendations, travelTips);
    }

    private String extractSection(String content, String startMarker, String endMarker) {
        String lowerContent = content.toLowerCase();
        String lowerStart = startMarker.toLowerCase();

        int startIndex = lowerContent.indexOf(lowerStart);
        if (startIndex == -1) {
            return content;
        }

        int sectionStart = startIndex + lowerStart.length();
        int sectionEnd = content.length();

        if (endMarker != null) {
            String lowerEnd = endMarker.toLowerCase();
            int endIndex = lowerContent.indexOf(lowerEnd, sectionStart);
            if (endIndex != -1) {
                sectionEnd = endIndex;
            }
        }

        return content.substring(sectionStart, sectionEnd).trim();
    }

    private DestinationResponse toResponse(Destination destination) {
        return new DestinationResponse(
                destination.getId(),
                destination.getName(),
                destination.getCountry(),
                destination.getContinent(),
                destination.getDescription(),
                destination.getImageUrl(),
                destination.getGalleryUrls(),
                destination.getTags(),
                destination.getClimate(),
                destination.getBestMonths(),
                destination.getAvgDailyCost(),
                destination.getCurrency(),
                destination.getLanguage(),
                destination.getPopularityScore(),
                destination.isFeatured()
        );
    }
}
