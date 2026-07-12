package com.travelai.audit;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

import static jakarta.persistence.GenerationType.UUID;

/**
 * Immutable record of a state-changing admin action. Written automatically by
 * {@link AuditInterceptor} for every mutating request under {@code /api/admin/**}.
 */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    /** Email of the authenticated admin who performed the action. */
    @Column(name = "actor", nullable = false)
    private String actor;

    /** HTTP verb: POST, PUT, PATCH, DELETE. */
    @Column(name = "method", nullable = false, length = 10)
    private String method;

    /** Request path, e.g. /api/admin/users/{uuid}/status. */
    @Column(name = "path", nullable = false, columnDefinition = "text")
    private String path;

    /** Coarse action label derived from the path, e.g. "users". */
    @Column(name = "action", nullable = false)
    private String action;

    /** Target entity id when present in the path (last UUID segment). */
    @Column(name = "target_id")
    private String targetId;

    /** HTTP status code of the response. */
    @Column(name = "status_code", nullable = false)
    private int statusCode;

    /** Originating IP address. */
    @Column(name = "ip")
    private String ip;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
