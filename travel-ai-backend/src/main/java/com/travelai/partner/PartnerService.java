package com.travelai.partner;

import com.travelai.auth.User;
import com.travelai.partner.dto.ConfigurePartnerRequest;
import com.travelai.partner.dto.PartnerResponse;
import com.travelai.partner.dto.PartnerSummaryResponse;
import com.travelai.partner.dto.RegisterPartnerRequest;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PartnerService {

    private final PartnerRepository partnerRepository;
    private final PartnerMapper partnerMapper;
    private final ApplicationEventPublisher eventPublisher;

    public PartnerResponse register(RegisterPartnerRequest request, User user) {
        Partner partner = partnerMapper.toEntity(request);
        partner.setUser(user);
        partner.setStatus(PartnerStatus.REGISTERED);
        partner.setActive(true);

        Partner saved = partnerRepository.save(partner);
        log.info("Partner registered: id={}, name={}", saved.getId(), saved.getName());

        eventPublisher.publishEvent(
                new PartnerRegisteredEvent(saved.getId(), saved.getContactEmail(), saved.getName())
        );

        return partnerMapper.toResponse(saved);
    }

    public PartnerResponse configure(UUID partnerId, ConfigurePartnerRequest request) {
        Partner partner = loadActivePartner(partnerId);

        partner.setAddress(request.address());
        partner.setCity(request.city());
        if (request.country() != null) {
            partner.setCountry(request.country());
        }
        partner.setLatitude(request.latitude());
        partner.setLongitude(request.longitude());
        partner.setContactPhone(request.contactPhone());

        if (partner.getStatus() == PartnerStatus.REGISTERED) {
            partner.setStatus(PartnerStatus.CONFIGURED);
        }

        Partner saved = partnerRepository.save(partner);
        log.info("Partner configured: id={}", saved.getId());
        return partnerMapper.toResponse(saved);
    }

    public PartnerResponse validate(UUID partnerId) {
        Partner partner = loadActivePartner(partnerId);

        if (partner.getStatus() != PartnerStatus.CONFIGURED) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }

        partner.setStatus(PartnerStatus.VALIDATED);
        Partner saved = partnerRepository.save(partner);
        log.info("Partner validated: id={}", saved.getId());
        return partnerMapper.toResponse(saved);
    }

    public PartnerResponse goLive(UUID partnerId) {
        Partner partner = loadActivePartner(partnerId);

        if (partner.getStatus() != PartnerStatus.VALIDATED) {
            throw TravelAiException.badRequest(ErrorCode.VALIDATION_ERROR);
        }

        partner.setStatus(PartnerStatus.LIVE);
        Partner saved = partnerRepository.save(partner);
        log.info("Partner went live: id={}", saved.getId());
        return partnerMapper.toResponse(saved);
    }

    public void suspend(UUID partnerId) {
        Partner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PARTNER_NOT_FOUND));

        partner.setStatus(PartnerStatus.SUSPENDED);
        partner.setActive(false);
        partnerRepository.save(partner);
        log.info("Partner suspended: id={}", partnerId);
    }

    @Transactional(readOnly = true)
    public PartnerResponse getById(UUID partnerId) {
        Partner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PARTNER_NOT_FOUND));
        return partnerMapper.toResponse(partner);
    }

    @Transactional(readOnly = true)
    public Page<PartnerSummaryResponse> listAll(Pageable pageable) {
        return partnerRepository.findByActiveTrue(pageable)
                .map(partnerMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public Page<PartnerSummaryResponse> listByType(PartnerType type, Pageable pageable) {
        return partnerRepository.findByTypeAndActiveTrue(type, pageable)
                .map(partnerMapper::toSummary);
    }

    private Partner loadActivePartner(UUID partnerId) {
        return partnerRepository.findByIdAndActiveTrue(partnerId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PARTNER_NOT_FOUND));
    }
}
