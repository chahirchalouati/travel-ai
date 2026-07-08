package com.travelai.press;

import com.travelai.press.dto.PressCoverageResponse;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/press")
@RequiredArgsConstructor
public class PressController {

    private final PressCoverageRepository repository;

    @GetMapping("/coverage")
    public ApiResponse<List<PressCoverageResponse>> getCoverage() {
        List<PressCoverageResponse> coverage = repository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(c -> new PressCoverageResponse(
                        c.getId(), c.getOutlet(), c.getHeadline(), c.getUrl(), c.getIcon(), c.getDateLabel()))
                .toList();
        return ApiResponse.ok(coverage);
    }
}
