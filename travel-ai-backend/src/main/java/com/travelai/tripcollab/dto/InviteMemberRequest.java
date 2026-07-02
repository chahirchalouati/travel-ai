package com.travelai.tripcollab.dto;

import com.travelai.tripcollab.TripRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InviteMemberRequest(
        @NotBlank @Email String email,
        @NotNull TripRole role
) {
}
