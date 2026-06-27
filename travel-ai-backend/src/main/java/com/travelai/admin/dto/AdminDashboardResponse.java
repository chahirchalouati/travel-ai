package com.travelai.admin.dto;

public record AdminDashboardResponse(
    long totalUsers,
    long totalPartners,
    long totalBookings,
    long totalBookingsToday,
    double totalRevenue,
    long activePartners,
    long pendingPartners
) {}
