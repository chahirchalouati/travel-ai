package com.travelai.partner;

import com.travelai.partner.dto.PartnerResponse;
import com.travelai.partner.dto.PartnerSummaryResponse;
import com.travelai.partner.dto.RegisterPartnerRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PartnerMapper {

    PartnerResponse toResponse(Partner partner);

    PartnerSummaryResponse toSummary(Partner partner);

    @Mapping(target = "status", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "qualityScore", ignore = true)
    @Mapping(target = "latitude", ignore = true)
    @Mapping(target = "longitude", ignore = true)
    Partner toEntity(RegisterPartnerRequest request);
}
