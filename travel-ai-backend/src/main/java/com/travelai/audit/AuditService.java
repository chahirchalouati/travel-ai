package com.travelai.audit;

import com.travelai.audit.dto.AuditLogResponse;
import com.travelai.event.AuthAuditEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuditService {

    /** Marks authentication rows so they stand out from HTTP admin verbs in the trail. */
    private static final String AUTH_METHOD = "AUTH";

    private final AuditLogRepository repository;

    @Transactional
    public void record(AuditLog log) {
        repository.save(log);
    }

    /**
     * Persists an authentication action in its own transaction. {@code REQUIRES_NEW} is
     * deliberate: the publishing auth flow may roll back (a failed login throws), and the
     * audit row must outlive that rollback.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuthAuditEvent event) {
        repository.save(AuditLog.builder()
                .actor(StringUtils.hasText(event.actor()) ? event.actor() : "anonymous")
                .method(AUTH_METHOD)
                .path("/auth/" + event.action())
                .action(event.action())
                .targetId(event.targetId())
                .statusCode(event.success() ? 200 : 401)
                .ip(event.ip())
                .build());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> search(String actor, String action, Pageable pageable) {
        String actorFilter = StringUtils.hasText(actor) ? actor.trim() : null;
        String actionFilter = StringUtils.hasText(action) ? action.trim() : null;
        return repository.search(actorFilter, actionFilter, pageable)
                .map(AuditLogResponse::from);
    }
}
