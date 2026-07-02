package com.travelai.tripcollab.dto;

import java.util.UUID;

public record SegmentVoteView(UUID userId, String displayName, String vote) {
}
