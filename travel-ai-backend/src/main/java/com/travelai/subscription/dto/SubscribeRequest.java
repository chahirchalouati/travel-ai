package com.travelai.subscription.dto;

import jakarta.validation.constraints.NotBlank;

/** Request to subscribe to (or switch to) a membership plan. */
public record SubscribeRequest(@NotBlank String planCode) {}
