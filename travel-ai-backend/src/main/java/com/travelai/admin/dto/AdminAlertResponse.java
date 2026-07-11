package com.travelai.admin.dto;

/** A single operational alert for the admin dashboard. */
public record AdminAlertResponse(String code, String severity, long count) {
}
