package com.travelai.admin.dto;

public record AdminDashboardResponse(
    long totalUsers,
    long totalPartners,
    long totalBookings,
    long totalBookingsToday,
    double totalRevenue,
    long activePartners,
    long pendingPartners,
    long totalHotels,
    long totalFlights,
    long totalCruises,
    long totalRestaurants,
    long totalDestinations,
    long totalStories
) {}
