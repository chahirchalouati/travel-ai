package com.travelai.audit;

import com.travelai.audit.dto.AuditLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repository;

    @Transactional
    public void record(AuditLog log) {
        repository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> search(String actor, String action, Pageable pageable) {
        String actorFilter = StringUtils.hasText(actor) ? actor.trim() : null;
        String actionFilter = StringUtils.hasText(action) ? action.trim() : null;
        return repository.search(actorFilter, actionFilter, pageable)
                .map(AuditLogResponse::from);
    }
}
