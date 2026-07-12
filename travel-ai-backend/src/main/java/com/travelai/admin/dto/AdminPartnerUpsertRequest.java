package com.travelai.admin.dto;

import com.travelai.partner.PartnerType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Admin create/update payload for partners. */
public record AdminPartnerUpsertRequest(
        @NotNull PartnerType type,
        @NotBlank @Size(max = 255) String name,
        String vatNumber,
        @Email @NotBlank String contactEmail,
        String contactPhone,
        String address,
        @NotBlank String city,
        String country,
        Boolean active
) {}
