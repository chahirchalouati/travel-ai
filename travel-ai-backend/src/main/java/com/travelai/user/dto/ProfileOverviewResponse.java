package com.travelai.user.dto;

import com.travelai.review.dto.ReviewResponse;

import java.util.List;

/** Aggregated, fully backend-derived snapshot of a traveler's profile. */
public record ProfileOverviewResponse(
        String displayName,
        String handle,
        int memberSinceYear,
        Stats stats,
        List<ReviewResponse> reviews,
        List<String> photos,
        List<Activity> activity,
        List<Achievement> achievements,
        List<Trip> trips,
        List<String> places
) {
    public record Stats(
            long reviewCount,
            long helpfulVotes,
            long photoCount,
            long tripCount,
            long placesCount) {}

    public record Activity(String icon, String color, String text, String time) {}

    public record Achievement(String icon, String label, String sublabel, boolean locked, String color) {}

    public record Trip(String title, String location, String status, String dates) {}
}
