package com.travelai.careers;

import com.travelai.careers.dto.JobPositionResponse;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/careers")
@RequiredArgsConstructor
public class CareersController {

    private final JobPositionRepository repository;

    @GetMapping("/positions")
    public ApiResponse<List<JobPositionResponse>> getPositions() {
        List<JobPositionResponse> positions = repository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(p -> new JobPositionResponse(
                        p.getId(), p.getTitle(), p.getDepartment(), p.getLocation(),
                        p.getEmploymentType(), p.getApplyEmail()))
                .toList();
        return ApiResponse.ok(positions);
    }
}
