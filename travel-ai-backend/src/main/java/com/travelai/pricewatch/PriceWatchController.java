package com.travelai.pricewatch;

import com.travelai.pricewatch.dto.CreatePriceWatchRequest;
import com.travelai.pricewatch.dto.PriceWatchResponse;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/price-watches")
@RequiredArgsConstructor
public class PriceWatchController {

    private final PriceWatchService priceWatchService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PriceWatchResponse> create(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody CreatePriceWatchRequest req) {
        return ApiResponse.ok(priceWatchService.create(user.getUsername(), req));
    }

    @GetMapping
    public ApiResponse<List<PriceWatchResponse>> list(@AuthenticationPrincipal UserDetails user) {
        return ApiResponse.ok(priceWatchService.listMine(user.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        priceWatchService.delete(user.getUsername(), id);
        return ApiResponse.ok(null);
    }
}
