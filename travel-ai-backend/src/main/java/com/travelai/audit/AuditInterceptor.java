package com.travelai.audit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Records every mutating admin request as an {@link AuditLog}. Instantiated with {@code new}
 * and registered for {@code /api/admin/**} by {@link AuditWebConfig}, so it is never a bean
 * (never proxied). The {@link AuditService} is resolved lazily per request via an
 * {@link ObjectProvider} so registering this interceptor never forces the service (and its
 * JPA graph) to be created while the MVC/AOP infrastructure is still bootstrapping. Failures
 * never break the request.
 */
@Slf4j
public class AuditInterceptor implements HandlerInterceptor {

    private static final Set<String> MUTATING = Set.of("POST", "PUT", "PATCH", "DELETE");
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    private final ObjectProvider<AuditService> auditService;

    public AuditInterceptor(ObjectProvider<AuditService> auditService) {
        this.auditService = auditService;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        try {
            if (!MUTATING.contains(request.getMethod().toUpperCase())) {
                return;
            }
            String path = request.getRequestURI();
            auditService.getObject().record(AuditLog.builder()
                    .actor(resolveActor())
                    .method(request.getMethod().toUpperCase())
                    .path(path)
                    .action(resolveAction(path))
                    .targetId(resolveTargetId(path))
                    .statusCode(response.getStatus())
                    .ip(resolveIp(request))
                    .build());
        } catch (Exception loggingFailure) {
            log.warn("Failed to write audit log for {} {}", request.getMethod(),
                    request.getRequestURI(), loggingFailure);
        }
    }

    private String resolveActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            return "anonymous";
        }
        return auth.getName();
    }

    /** First path segment after "admin", e.g. /api/admin/users/{id} -> "users". */
    private String resolveAction(String path) {
        String[] parts = path.split("/");
        for (int i = 0; i < parts.length - 1; i++) {
            if ("admin".equals(parts[i]) && StringUtils.hasText(parts[i + 1])) {
                return parts[i + 1];
            }
        }
        return "admin";
    }

    /** Last UUID segment in the path, if any. */
    private String resolveTargetId(String path) {
        String candidate = null;
        for (String segment : path.split("/")) {
            if (UUID_PATTERN.matcher(segment).matches()) {
                candidate = segment;
            }
        }
        return candidate;
    }

    private String resolveIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
