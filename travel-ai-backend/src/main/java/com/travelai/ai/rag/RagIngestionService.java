package com.travelai.ai.rag;

import com.travelai.catalog.hotel.Hotel;
import com.travelai.catalog.hotel.HotelRepository;
import com.travelai.catalog.restaurant.Restaurant;
import com.travelai.catalog.restaurant.RestaurantRepository;
import com.travelai.destination.Destination;
import com.travelai.destination.DestinationRepository;
import com.travelai.review.Review;
import com.travelai.review.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagIngestionService {

    private final VectorStore vectorStore;
    private final JdbcTemplate jdbcTemplate;
    private final DestinationRepository destinationRepository;
    private final HotelRepository hotelRepository;
    private final RestaurantRepository restaurantRepository;
    private final ReviewRepository reviewRepository;

    /**
     * Ingest only when the store is empty. Without this guard the listener re-ran on every
     * application restart and appended a fresh copy of every document, so each doc ended up
     * duplicated N times — which collapsed top-K retrieval to N identical copies of one doc.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void ingestOnStartup() {
        long existing = countDocuments();
        if (existing > 0) {
            log.info("RAG store already populated ({} documents) — skipping startup ingestion. " +
                    "Use POST /admin/rag/ingest to force a clean rebuild.", existing);
            return;
        }
        log.info("RAG store empty — starting ingestion...");
        try {
            ingestAll();
            log.info("RAG data ingestion completed successfully");
        } catch (Exception e) {
            log.error("RAG data ingestion failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Full, idempotent rebuild: clears the store first so re-running always yields exactly one
     * copy of every document. Safe to call repeatedly (e.g. after catalog edits).
     */
    public int ingestAll() {
        clearStore();

        List<Document> documents = new ArrayList<>();
        documents.addAll(buildDestinationDocuments());
        documents.addAll(buildHotelDocuments());
        documents.addAll(buildRestaurantDocuments());
        documents.addAll(buildReviewDocuments());

        if (documents.isEmpty()) {
            log.warn("No documents to ingest");
            return 0;
        }

        vectorStore.add(documents);
        log.info("Ingested {} documents into vector store", documents.size());
        return documents.size();
    }

    /**
     * Read-only snapshot of the vector store for the admin RAG console: total document
     * count and a per-type breakdown. Never throws — returns zeros if the store is
     * unavailable.
     */
    public java.util.Map<String, Object> status() {
        long total = countDocuments();
        java.util.Map<String, Long> byType = new java.util.LinkedHashMap<>();
        try {
            jdbcTemplate.query(
                    "SELECT metadata->>'type' AS type, count(*) AS n FROM vector_store GROUP BY 1 ORDER BY 2 DESC",
                    rs -> {
                        String type = rs.getString("type");
                        byType.put(type != null ? type : "unknown", rs.getLong("n"));
                    });
        } catch (Exception e) {
            log.warn("Could not read vector_store breakdown: {}", e.getMessage());
        }
        return java.util.Map.of(
                "totalDocuments", total,
                "byType", byType,
                "populated", total > 0);
    }

    private long countDocuments() {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM vector_store", Long.class);
            return count != null ? count : 0L;
        } catch (Exception e) {
            log.warn("Could not count vector_store rows, assuming empty: {}", e.getMessage());
            return 0L;
        }
    }

    private void clearStore() {
        int removed = jdbcTemplate.update("DELETE FROM vector_store");
        if (removed > 0) {
            log.info("Cleared {} existing documents from vector store before rebuild", removed);
        }
    }

    private List<Document> buildDestinationDocuments() {
        List<Destination> destinations = destinationRepository.findAll();
        return destinations.stream()
                .filter(Destination::isActive)
                .map(this::toDocument)
                .toList();
    }

    private Document toDocument(Destination d) {
        String content = """
                Destination: %s, %s (%s)
                Description: %s
                Climate: %s | Best months to visit: %s
                Average daily cost: %s %s
                Tags: %s
                """.formatted(
                d.getName(), d.getCountry(), d.getContinent(),
                orEmpty(d.getDescription()),
                orEmpty(d.getClimate()), orEmpty(d.getBestMonths()),
                d.getAvgDailyCost(), orEmpty(d.getCurrency()),
                orEmpty(d.getTags())
        );

        return new Document(content, Map.of(
                "type", "destination",
                "entityId", d.getId().toString(),
                "name", d.getName(),
                "country", d.getCountry()
        ));
    }

    private List<Document> buildHotelDocuments() {
        List<Hotel> hotels = hotelRepository.findAll();
        return hotels.stream()
                .filter(Hotel::isActive)
                .map(this::toDocument)
                .toList();
    }

    private Document toDocument(Hotel h) {
        List<String> features = new ArrayList<>();
        if (h.isPetFriendly()) features.add("pet-friendly");
        if (h.isAccessible()) features.add("accessible");
        if (h.isFamilyFriendly()) features.add("family-friendly");
        if (h.isSeaProximity()) features.add("near the sea");

        String content = """
                Hotel: %s (%d stars) in %s
                Description: %s
                Price per night: €%s
                Features: %s
                """.formatted(
                h.getName(), h.getStars(), orEmpty(h.getCity()),
                orEmpty(h.getDescription()),
                h.getBasePriceNight(),
                features.isEmpty() ? "none listed" : String.join(", ", features)
        );

        return new Document(content, Map.of(
                "type", "hotel",
                "entityId", h.getId().toString(),
                "name", h.getName(),
                "city", orEmpty(h.getCity())
        ));
    }

    private List<Document> buildRestaurantDocuments() {
        List<Restaurant> restaurants = restaurantRepository.findByActiveTrue();
        return restaurants.stream()
                .map(this::toDocument)
                .toList();
    }

    private Document toDocument(Restaurant r) {
        String content = """
                Restaurant: %s in %s
                Cuisine: %s | Price tier: %d/5
                Description: %s
                Features: %s
                """.formatted(
                r.getName(), orEmpty(r.getCity()),
                orEmpty(r.getCuisineType()), r.getPriceTier(),
                orEmpty(r.getDescription()),
                buildRestaurantFeatures(r)
        );

        return new Document(content, Map.of(
                "type", "restaurant",
                "entityId", r.getId().toString(),
                "name", r.getName(),
                "city", orEmpty(r.getCity())
        ));
    }

    private String buildRestaurantFeatures(Restaurant r) {
        List<String> features = new ArrayList<>();
        if (r.isPetFriendly()) features.add("pet-friendly");
        if (r.isAccessible()) features.add("accessible");
        return features.isEmpty() ? "none listed" : String.join(", ", features);
    }

    private List<Document> buildReviewDocuments() {
        List<Review> reviews = reviewRepository.findAll();
        return reviews.stream()
                .filter(r -> r.getContent() != null && !r.getContent().isBlank())
                .map(this::toDocument)
                .toList();
    }

    private Document toDocument(Review r) {
        String content = """
                Review: "%s" — Rating: %d/5
                %s
                """.formatted(
                orEmpty(r.getTitle()),
                r.getRating(),
                r.getContent()
        );

        return new Document(content, Map.of(
                "type", "review",
                "entityId", r.getId().toString(),
                "targetType", orEmpty(r.getTargetType()),
                "targetId", r.getTargetId().toString(),
                "rating", String.valueOf(r.getRating())
        ));
    }

    private static String orEmpty(String value) {
        return value == null ? "" : value;
    }
}
