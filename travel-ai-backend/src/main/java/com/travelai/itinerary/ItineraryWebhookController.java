package com.travelai.itinerary;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelai.ai.planning.AiRateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Receives external disruption pushes (airline, venue, etc.) and converts them into
 * a {@link ItineraryEvent}. Body must carry a {@code segmentId}; {@code description}
 * is optional.
 *
 * <p>The endpoint is unauthenticated at the Spring Security layer (covered by the
 * permitAll {@code /webhooks/**} matcher), so it protects itself two ways:
 * <ul>
 *   <li>a shared-secret {@code X-Webhook-Secret} header, enforced whenever
 *       {@code travel-ai.itinerary.webhook-secret} is configured (set in production);</li>
 *   <li>a per-source rate limit, since each accepted push spends AI tokens on a re-plan.</li>
 * </ul>
 * When no secret is configured (local dev) the header check is skipped so the flow
 * stays easy to exercise.
 */
@RestController
@RequestMapping("/webhooks/itinerary")
@RequiredArgsConstructor
@Slf4j
public class ItineraryWebhookController {

    private final LiveItineraryService liveItineraryService;
    private final ObjectMapper objectMapper;
    private final AiRateLimiter rateLimiter;

    @Value("${travel-ai.itinerary.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/{source}")
    public ResponseEntity<Void> receive(
            @PathVariable String source,
            @RequestHeader(value = "X-Webhook-Secret", required = false) String providedSecret,
            @RequestBody String rawBody) {

        if (!secretMatches(providedSecret)) {
            log.warn("Rejected itinerary webhook from {}: invalid or missing secret", source);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!rateLimiter.tryAcquire("webhook:" + source)) {
            log.warn("Rate limited itinerary webhook from {}", source);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

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

    /** When a secret is configured it must match exactly; when blank (dev) the check is skipped. */
    private boolean secretMatches(String providedSecret) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            return true;
        }
        return webhookSecret.equals(providedSecret);
    }
}
