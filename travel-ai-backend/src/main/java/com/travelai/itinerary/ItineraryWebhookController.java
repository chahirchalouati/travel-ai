package com.travelai.itinerary;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Receives external disruption pushes (airline, venue, etc.) and converts them into
 * a {@link ItineraryEvent}. Body must carry a {@code segmentId}; {@code description}
 * is optional. Unauthenticated — covered by the permitAll {@code /webhooks/**} matcher.
 */
@RestController
@RequestMapping("/webhooks/itinerary")
@RequiredArgsConstructor
@Slf4j
public class ItineraryWebhookController {

    private final LiveItineraryService liveItineraryService;
    private final ObjectMapper objectMapper;

    @PostMapping("/{source}")
    public ResponseEntity<Void> receive(@PathVariable String source, @RequestBody String rawBody) {
        try {
            JsonNode node = objectMapper.readTree(rawBody);
            String segmentIdText = node.path("segmentId").asText(null);
            if (segmentIdText == null || segmentIdText.isBlank()) {
                log.warn("Itinerary webhook from {} missing segmentId", source);
                return ResponseEntity.badRequest().build();
            }
            String description = node.path("description").asText("Disruption reported via " + source);
            liveItineraryService.recordWebhookEvent(UUID.fromString(segmentIdText), description, rawBody);
        } catch (Exception ex) {
            log.warn("Failed to process itinerary webhook from {}: {}", source, ex.getMessage());
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.accepted().build();
    }
}
