package com.travelai.ai.rag;

import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/rag")
@RequiredArgsConstructor
public class RagController {

    private final RagIngestionService ragIngestionService;

    @PostMapping("/ingest")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Map<String, Object>> ingest() {
        int count = ragIngestionService.ingestAll();
        return ApiResponse.ok(Map.of(
                "documentsIngested", count,
                "status", "completed"
        ));
    }
}
