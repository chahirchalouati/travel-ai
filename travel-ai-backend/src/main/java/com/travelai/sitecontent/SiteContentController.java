package com.travelai.sitecontent;

import com.travelai.shared.domain.ApiResponse;
import com.travelai.sitecontent.dto.SiteContentItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/site-content")
@RequiredArgsConstructor
public class SiteContentController {

    private final SiteContentItemRepository repository;

    @GetMapping("/{page}")
    public ApiResponse<List<SiteContentItemResponse>> getPage(@PathVariable String page) {
        List<SiteContentItemResponse> items = repository
                .findByPageAndActiveTrueOrderBySectionAscSortOrderAsc(page).stream()
                .map(i -> new SiteContentItemResponse(
                        i.getSection(), i.getTitle(), i.getBody(), i.getIcon(),
                        i.getAccent(), i.getValue(), splitBullets(i.getBullets())))
                .toList();
        return ApiResponse.ok(items);
    }

    private static List<String> splitBullets(String bullets) {
        if (bullets == null || bullets.isBlank()) {
            return List.of();
        }
        return List.of(bullets.split("\n"));
    }
}
