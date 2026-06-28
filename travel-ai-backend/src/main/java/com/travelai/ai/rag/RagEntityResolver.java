package com.travelai.ai.rag;

import com.travelai.ai.chat.dto.ChatEntityAttachment;
import com.travelai.catalog.hotel.Hotel;
import com.travelai.catalog.hotel.HotelRepository;
import com.travelai.catalog.restaurant.Restaurant;
import com.travelai.catalog.restaurant.RestaurantRepository;
import com.travelai.destination.Destination;
import com.travelai.destination.DestinationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagEntityResolver {

    private final DestinationRepository destinationRepository;
    private final HotelRepository hotelRepository;
    private final RestaurantRepository restaurantRepository;

    public List<ChatEntityAttachment> resolveAttachments(List<Document> ragResults) {
        if (ragResults == null || ragResults.isEmpty()) {
            return List.of();
        }

        List<ChatEntityAttachment> attachments = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (Document doc : ragResults) {
            Map<String, Object> meta = doc.getMetadata();
            String type = (String) meta.get("type");
            String entityId = (String) meta.get("entityId");

            if (type == null || entityId == null || !seen.add(type + ":" + entityId)) {
                continue;
            }

            try {
                UUID id = UUID.fromString(entityId);
                ChatEntityAttachment attachment = switch (type) {
                    case "destination" -> resolveDestination(id);
                    case "hotel" -> resolveHotel(id);
                    case "restaurant" -> resolveRestaurant(id);
                    default -> null;
                };
                if (attachment != null) {
                    attachments.add(attachment);
                }
            } catch (Exception e) {
                log.debug("Failed to resolve entity {}:{} — {}", type, entityId, e.getMessage());
            }
        }

        return attachments;
    }

    private ChatEntityAttachment resolveDestination(UUID id) {
        return destinationRepository.findById(id)
                .filter(Destination::isActive)
                .map(d -> new ChatEntityAttachment(
                        d.getId(),
                        "destination",
                        d.getName(),
                        d.getCountry() + (d.getContinent() != null ? ", " + d.getContinent() : ""),
                        truncate(d.getDescription(), 150),
                        d.getImageUrl(),
                        d.getAvgDailyCost(),
                        "avg/day",
                        null,
                        d.getLatitude(),
                        d.getLongitude(),
                        parseTags(d.getTags())
                ))
                .orElse(null);
    }

    private ChatEntityAttachment resolveHotel(UUID id) {
        return hotelRepository.findById(id)
                .filter(Hotel::isActive)
                .map(h -> {
                    List<String> tags = new ArrayList<>();
                    if (h.isPetFriendly()) tags.add("Pet-friendly");
                    if (h.isAccessible()) tags.add("Accessible");
                    if (h.isFamilyFriendly()) tags.add("Family-friendly");
                    if (h.isSeaProximity()) tags.add("Near sea");

                    return new ChatEntityAttachment(
                            h.getId(),
                            "hotel",
                            h.getName(),
                            starsLabel(h.getStars()) + " · " + orEmpty(h.getCity()),
                            truncate(h.getDescription(), 150),
                            h.getImageUrl(),
                            h.getBasePriceNight(),
                            "/night",
                            h.getStars() != null ? h.getStars().intValue() : null,
                            h.getLatitude(),
                            h.getLongitude(),
                            tags
                    );
                })
                .orElse(null);
    }

    private ChatEntityAttachment resolveRestaurant(UUID id) {
        return restaurantRepository.findById(id)
                .filter(Restaurant::isActive)
                .map(r -> {
                    List<String> tags = new ArrayList<>();
                    if (r.getCuisineType() != null) tags.add(r.getCuisineType());
                    if (r.isPetFriendly()) tags.add("Pet-friendly");
                    if (r.isAccessible()) tags.add("Accessible");

                    return new ChatEntityAttachment(
                            r.getId(),
                            "restaurant",
                            r.getName(),
                            orEmpty(r.getCuisineType()) + " · " + orEmpty(r.getCity()),
                            truncate(r.getDescription(), 150),
                            r.getImageUrl(),
                            null,
                            priceTierLabel(r.getPriceTier()),
                            r.getPriceTier() != null ? r.getPriceTier().intValue() : null,
                            r.getLatitude(),
                            r.getLongitude(),
                            tags
                    );
                })
                .orElse(null);
    }

    private static String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }

    private static String orEmpty(String val) {
        return val == null ? "" : val;
    }

    private static String starsLabel(Short stars) {
        if (stars == null) return "Hotel";
        return "★".repeat(stars);
    }

    private static String priceTierLabel(Short tier) {
        if (tier == null) return "";
        return "€".repeat(tier);
    }

    private static List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .limit(5)
                .toList();
    }
}
