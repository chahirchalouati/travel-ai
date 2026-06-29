package com.travelai.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PhotoRequest(
        @NotBlank @Size(max = 500) String url,
        @Size(max = 280) String caption,
        @Size(max = 160) String place
) {}
