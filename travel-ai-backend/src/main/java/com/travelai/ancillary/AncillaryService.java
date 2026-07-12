package com.travelai.ancillary;

import com.travelai.ancillary.dto.AncillaryOptionResponse;
import com.travelai.ancillary.dto.AncillarySelection;
import com.travelai.ancillary.dto.ResolvedAncillary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Reads the ancillary catalogue and resolves client selections into
 * server-authoritative, priced line items. The service never trusts a
 * client-supplied price — only the option code and quantity.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AncillaryService {

    private static final int MAX_QUANTITY = 20;

    private final AncillaryOptionRepository optionRepository;

    /** Active options offered for a vertical (plus the vertical-agnostic ones). */
    @Transactional(readOnly = true)
    public List<AncillaryOptionResponse> listForVertical(String vertical) {
        return optionRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .filter(o -> o.getVertical() == null
                        || vertical == null
                        || o.getVertical().equalsIgnoreCase(vertical))
                .map(AncillaryOptionResponse::from)
                .toList();
    }

    /**
     * Resolves client selections against the catalogue. Unknown or inactive codes
     * are skipped (best-effort, logged), quantities are clamped to a sane range, so
     * a stale client can never inflate the total or reference a retired add-on.
     */
    @Transactional(readOnly = true)
    public List<ResolvedAncillary> resolve(List<AncillarySelection> selections) {
        if (selections == null || selections.isEmpty()) {
            return List.of();
        }
        return selections.stream()
                .filter(s -> s != null && s.code() != null)
                .map(this::resolveOne)
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    private ResolvedAncillary resolveOne(AncillarySelection selection) {
        return optionRepository.findByCodeIgnoreCase(selection.code().trim())
                .filter(AncillaryOption::isActive)
                .map(option -> new ResolvedAncillary(
                        option.getCode(),
                        option.getLabel(),
                        option.getPrice(),
                        clampQuantity(selection.quantity()),
                        option.getCurrency()))
                .orElseGet(() -> {
                    log.warn("Ignoring unknown/inactive ancillary code '{}'", selection.code());
                    return null;
                });
    }

    private int clampQuantity(Integer quantity) {
        if (quantity == null || quantity < 1) {
            return 1;
        }
        return Math.min(quantity, MAX_QUANTITY);
    }
}
