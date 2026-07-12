package com.travelai.help;

import com.travelai.help.dto.HelpFaqResponse;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/help")
@RequiredArgsConstructor
public class HelpController {

    private final HelpFaqRepository repository;

    @GetMapping("/faqs")
    public ApiResponse<List<HelpFaqResponse>> getFaqs() {
        List<HelpFaqResponse> faqs = repository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(f -> new HelpFaqResponse(f.getId(), f.getQuestion(), f.getAnswer(), f.getCategory()))
                .toList();
        return ApiResponse.ok(faqs);
    }
}
