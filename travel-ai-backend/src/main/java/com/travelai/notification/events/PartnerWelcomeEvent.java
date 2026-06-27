package com.travelai.notification.events;

import java.util.UUID;

/** Published by the partner module after successful registration. */
public record PartnerWelcomeEvent(UUID partnerId, String contactEmail, String partnerName) {}
