package com.travelai.audit.dto;

import com.travelai.audit.AuditLog;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String actor,
        String method,
        String path,
        String action,
        String targetId,
        int statusCode,
        String ip,
        Instant createdAt) {

    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActor(),
                log.getMethod(),
                log.getPath(),
                log.getAction(),
                log.getTargetId(),
                log.getStatusCode(),
                log.getIp(),
                log.getCreatedAt());
    }
}
