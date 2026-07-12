package com.travelai.partner.dto;

import com.travelai.partner.PartnerType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterPartnerRequest(
        @NotNull PartnerType type,
        @NotBlank @Size(max = 255) String name,
        String vatNumber,
        @Email @NotBlank String contactEmail,
        String contactPhone,
        String address,
        @NotBlank String city,
        String country
) {}
