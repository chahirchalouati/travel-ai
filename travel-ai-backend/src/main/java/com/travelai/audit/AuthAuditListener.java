package com.travelai.audit;

import com.travelai.event.AuthAuditEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Records authentication actions (published as {@link AuthAuditEvent}) into the audit trail.
 *
 * <p>Uses a <em>synchronous</em> {@link EventListener} — not {@code @ApplicationModuleListener} —
 * on purpose: {@code AuthService} runs in a transaction that <em>rolls back</em> on a failed
 * login (it throws), so an after-commit listener would silently drop exactly the events worth
 * auditing. {@link AuditService#record(AuthAuditEvent)} writes in a fresh {@code REQUIRES_NEW}
 * transaction, so the audit row survives that rollback. Failures here never break the auth flow.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class AuthAuditListener {

    private final AuditService auditService;

    @EventListener
    void onAuthAudit(AuthAuditEvent event) {
        try {
            auditService.record(event);
        } catch (Exception ex) {
            log.warn("Failed to write auth audit log for action={} actor={}",
                    event.action(), event.actor(), ex);
        }
    }
}
