package com.travelai.ancillary;

import com.travelai.ancillary.dto.AncillaryOptionResponse;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public catalogue of purchasable add-ons. Mounted under {@code /api/catalog},
 * which is already allow-listed, so the funnel can read it without auth.
 */
@RestController
@RequestMapping("/catalog/ancillaries")
@RequiredArgsConstructor
public class AncillaryController {

    private final AncillaryService ancillaryService;

    @GetMapping
    public ApiResponse<List<AncillaryOptionResponse>> list(
            @RequestParam(required = false) String vertical) {
        return ApiResponse.ok(ancillaryService.listForVertical(vertical));
    }
}
