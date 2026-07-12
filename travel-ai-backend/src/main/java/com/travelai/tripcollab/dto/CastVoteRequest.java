package com.travelai.tripcollab.dto;

import com.travelai.tripcollab.VoteValue;
import jakarta.validation.constraints.NotNull;

public record CastVoteRequest(@NotNull VoteValue vote) {
}
