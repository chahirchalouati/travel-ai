package com.travelai.promo;

import com.travelai.promo.dto.PromoValidationResponse;
import com.travelai.promo.dto.ValidatePromoRequest;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/promo")
@RequiredArgsConstructor
public class PromoController {

    private final PromoService promoService;

    @PostMapping("/validate")
    public ApiResponse<PromoValidationResponse> validate(@RequestBody ValidatePromoRequest req) {
        return ApiResponse.ok(promoService.validate(req.code(), req.amount()));
    }
}
