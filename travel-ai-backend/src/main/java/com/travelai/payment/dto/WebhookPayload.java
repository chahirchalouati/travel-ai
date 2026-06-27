package com.travelai.payment.dto;

public record WebhookPayload(String eventType, String gatewayReference, String rawBody) {}
