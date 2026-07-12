package com.travelai.ai.rag;

import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/rag")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RagController {

    private final RagIngestionService ragIngestionService;

    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> status() {
        return ApiResponse.ok(ragIngestionService.status());
    }

    @PostMapping("/ingest")
    public ApiResponse<Map<String, Object>> ingest() {
        int count = ragIngestionService.ingestAll();
        return ApiResponse.ok(Map.of(
                "documentsIngested", count,
                "status", "completed"
        ));
    }
}
