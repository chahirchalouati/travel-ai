package com.travelai.audit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditInterceptorTest {

    @Mock
    private AuditService auditService;

    @Mock
    private ObjectProvider<AuditService> auditServiceProvider;

    private AuditInterceptor interceptor;

    @BeforeEach
    void setUp() {
        lenient().when(auditServiceProvider.getObject()).thenReturn(auditService);
        interceptor = new AuditInterceptor(auditServiceProvider);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("records mutating admin request with actor, action and target id")
    void recordsMutatingRequest() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@travelai.com", "x", java.util.List.of()));
        String targetId = "11111111-2222-3333-4444-555555555555";
        var request = new MockHttpServletRequest(
                "PATCH", "/api/admin/users/" + targetId + "/status");
        request.setRemoteAddr("10.0.0.9");
        var response = new MockHttpServletResponse();
        response.setStatus(200);

        interceptor.afterCompletion(request, response, new Object(), null);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditService).record(captor.capture());
        AuditLog saved = captor.getValue();
        assertThat(saved.getActor()).isEqualTo("admin@travelai.com");
        assertThat(saved.getMethod()).isEqualTo("PATCH");
        assertThat(saved.getAction()).isEqualTo("users");
        assertThat(saved.getTargetId()).isEqualTo(targetId);
        assertThat(saved.getStatusCode()).isEqualTo(200);
        assertThat(saved.getIp()).isEqualTo("10.0.0.9");
    }

    @Test
    @DisplayName("skips read-only GET requests")
    void skipsGetRequests() {
        var request = new MockHttpServletRequest("GET", "/api/admin/users");
        var response = new MockHttpServletResponse();

        interceptor.afterCompletion(request, response, new Object(), null);

        verify(auditService, never()).record(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("falls back to anonymous actor when unauthenticated")
    void anonymousWhenNoAuth() {
        var request = new MockHttpServletRequest("DELETE", "/api/admin/reviews/abc");
        var response = new MockHttpServletResponse();

        interceptor.afterCompletion(request, response, new Object(), null);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditService).record(captor.capture());
        assertThat(captor.getValue().getActor()).isEqualTo("anonymous");
        assertThat(captor.getValue().getAction()).isEqualTo("reviews");
    }
}
