package com.travelai.admin.dto;

import com.travelai.booking.BookingStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateBookingStatusRequest(@NotNull BookingStatus status) {}
