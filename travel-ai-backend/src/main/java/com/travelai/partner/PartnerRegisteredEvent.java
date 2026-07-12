package com.travelai.partner;

import java.util.UUID;

public record PartnerRegisteredEvent(UUID partnerId, String contactEmail, String partnerName) {}
