package com.travelai.user;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.catalog.hotel.Hotel;
import com.travelai.catalog.hotel.HotelRepository;
import com.travelai.catalog.restaurant.Restaurant;
import com.travelai.catalog.restaurant.RestaurantRepository;
import com.travelai.review.Review;
import com.travelai.review.ReviewRepository;
import com.travelai.review.dto.ReviewResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import com.travelai.user.dto.ProfileOverviewResponse;
import com.travelai.user.dto.ProfileOverviewResponse.Achievement;
import com.travelai.user.dto.ProfileOverviewResponse.Activity;
import com.travelai.user.dto.ProfileOverviewResponse.Stats;
import com.travelai.user.dto.ProfileOverviewResponse.Trip;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private static final int MAX_REVIEWS = 50;
    private static final int MAX_BOOKINGS = 50;

    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final HotelRepository hotelRepository;
    private final RestaurantRepository restaurantRepository;

    @Transactional(readOnly = true)
    public ProfileOverviewResponse getOverview(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));

        var reviewPage = reviewRepository.findByUserIdOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(0, MAX_REVIEWS));
        List<Review> reviews = reviewPage.getContent();
        long reviewCount = reviewPage.getTotalElements();

        var bookingPage = bookingRepository.findByUserEmail(email, PageRequest.of(0, MAX_BOOKINGS));
        List<Booking> bookings = bookingPage.getContent();
        long tripCount = bookingPage.getTotalElements();

        List<String> photos = reviews.stream()
                .flatMap(r -> splitPhotos(r.getPhotoUrls()).stream())
                .distinct()
                .toList();

        long helpfulVotes = reviews.stream().mapToLong(Review::getHelpfulCount).sum();

        List<String> places = resolvePlaces(reviews, bookings);

        List<ReviewResponse> reviewResponses = reviews.stream()
                .map(ReviewResponse::from)
                .toList();

        Stats stats = new Stats(reviewCount, helpfulVotes, photos.size(), tripCount, places.size());

        String displayName = buildDisplayName(user);
        String handle = buildHandle(user);
        int memberSince = user.getCreatedAt() != null
                ? user.getCreatedAt().atZone(ZoneOffset.UTC).getYear()
                : Instant.now().atZone(ZoneOffset.UTC).getYear();

        return new ProfileOverviewResponse(
                displayName,
                handle,
                memberSince,
                stats,
                reviewResponses,
                photos,
                buildActivity(reviews, bookings),
                buildAchievements(reviewCount, photos.size(), places.size()),
                buildTrips(bookings),
                places);
    }

    private List<String> splitPhotos(String photoUrls) {
        if (photoUrls == null || photoUrls.isBlank()) {
            return List.of();
        }
        return List.of(photoUrls.split(",")).stream()
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    /** Distinct visited places from booking destinations and reviewed hotel/restaurant cities. */
    private List<String> resolvePlaces(List<Review> reviews, List<Booking> bookings) {
        LinkedHashSet<String> places = new LinkedHashSet<>();

        bookings.stream()
                .map(Booking::getDestination)
                .filter(d -> d != null && !d.isBlank())
                .forEach(places::add);

        Map<String, List<UUID>> targetsByType = reviews.stream()
                .collect(Collectors.groupingBy(
                        Review::getTargetType,
                        Collectors.mapping(Review::getTargetId, Collectors.toList())));

        List<UUID> hotelIds = targetsByType.getOrDefault("HOTEL", List.of());
        if (!hotelIds.isEmpty()) {
            hotelRepository.findAllById(hotelIds).stream()
                    .map(Hotel::getCity)
                    .filter(c -> c != null && !c.isBlank())
                    .forEach(places::add);
        }

        List<UUID> restaurantIds = targetsByType.getOrDefault("RESTAURANT", List.of());
        if (!restaurantIds.isEmpty()) {
            restaurantRepository.findAllById(restaurantIds).stream()
                    .map(Restaurant::getCity)
                    .filter(c -> c != null && !c.isBlank())
                    .forEach(places::add);
        }

        return new ArrayList<>(places);
    }

    private List<Activity> buildActivity(List<Review> reviews, List<Booking> bookings) {
        List<Activity> activity = new ArrayList<>();

        reviews.stream().limit(5).forEach(r -> {
            String title = r.getTitle() != null && !r.getTitle().isBlank() ? r.getTitle() : "a place";
            activity.add(new Activity(
                    "rate_review", "#00856A",
                    "Reviewed <b>" + escape(title) + "</b>",
                    relativeTime(r.getCreatedAt())));
        });

        bookings.stream().limit(3).forEach(b -> {
            if (b.getDestination() != null) {
                activity.add(new Activity(
                        "luggage", "#E04A2F",
                        "Booked a trip to <b>" + escape(b.getDestination()) + "</b>",
                        b.getCheckIn() != null ? b.getCheckIn().toString() : ""));
            }
        });

        return activity;
    }

    private List<Achievement> buildAchievements(long reviewCount, long photoCount, long placesCount) {
        long reviewsToStreak = Math.max(0, 10 - reviewCount);
        return List.of(
                new Achievement("public", "Globetrotter",
                        placesCount + " place" + (placesCount == 1 ? "" : "s") + " visited",
                        placesCount < 3, "#00856A"),
                new Achievement("rate_review", "Trusted Reviewer",
                        reviewCount + " review" + (reviewCount == 1 ? "" : "s") + " published",
                        reviewCount < 1, "#E04A2F"),
                new Achievement("photo_camera", "Top Photographer",
                        photoCount + " photo" + (photoCount == 1 ? "" : "s") + " shared",
                        photoCount < 1, "#F5A623"),
                new Achievement("local_fire_department", "Streak Master",
                        reviewsToStreak == 0 ? "Unlocked!" : "Review " + reviewsToStreak + " more to unlock",
                        reviewCount < 10, "#9B59B6"));
    }

    private List<Trip> buildTrips(List<Booking> bookings) {
        return bookings.stream()
                .filter(b -> b.getDestination() != null && !b.getDestination().isBlank())
                .map(b -> new Trip(
                        b.getDestination(),
                        b.getDestination(),
                        b.getStatus() != null ? b.getStatus().name().toLowerCase(Locale.ROOT) : "pending",
                        formatTripDates(b)))
                .toList();
    }

    private String formatTripDates(Booking booking) {
        if (booking.getCheckIn() == null) {
            return "";
        }
        if (booking.getCheckOut() == null) {
            return booking.getCheckIn().toString();
        }
        long nights = ChronoUnit.DAYS.between(booking.getCheckIn(), booking.getCheckOut());
        return booking.getCheckIn() + " · " + nights + " nights";
    }

    private String buildDisplayName(User user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isBlank() ? user.getEmail().split("@")[0] : name;
    }

    private String buildHandle(User user) {
        String base = ((user.getFirstName() == null ? "" : user.getFirstName())
                + (user.getLastName() == null ? "" : user.getLastName()))
                .toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
        if (base.isBlank()) {
            base = user.getEmail().split("@")[0].toLowerCase(Locale.ROOT);
        }
        int year = user.getCreatedAt() != null
                ? user.getCreatedAt().atZone(ZoneOffset.UTC).getYear()
                : Instant.now().atZone(ZoneOffset.UTC).getYear();
        return base + year;
    }

    private String relativeTime(Instant when) {
        if (when == null) {
            return "";
        }
        long days = ChronoUnit.DAYS.between(when, Instant.now());
        if (days <= 0) {
            return "today";
        }
        if (days == 1) {
            return "yesterday";
        }
        if (days < 7) {
            return days + " days ago";
        }
        if (days < 30) {
            return (days / 7) + " week" + (days / 7 == 1 ? "" : "s") + " ago";
        }
        return (days / 30) + " month" + (days / 30 == 1 ? "" : "s") + " ago";
    }

    private String escape(String value) {
        return value.replace("<", "&lt;").replace(">", "&gt;");
    }
}
