package com.travelai.audit;

import com.travelai.event.AuthAuditEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuditServiceAuthEventTest {

    @Mock
    private AuditLogRepository repository;

    @InjectMocks
    private AuditService service;

    @Test
    @DisplayName("maps a successful auth event to an AUTH row with status 200")
    void mapsSuccessfulLogin() {
        service.record(new AuthAuditEvent("login", "user@travelai.com", "id-1", true, "1.2.3.4"));

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(repository).save(captor.capture());
        AuditLog log = captor.getValue();
        assertThat(log.getMethod()).isEqualTo("AUTH");
        assertThat(log.getAction()).isEqualTo("login");
        assertThat(log.getPath()).isEqualTo("/auth/login");
        assertThat(log.getActor()).isEqualTo("user@travelai.com");
        assertThat(log.getTargetId()).isEqualTo("id-1");
        assertThat(log.getStatusCode()).isEqualTo(200);
        assertThat(log.getIp()).isEqualTo("1.2.3.4");
    }

    @Test
    @DisplayName("maps a failed auth event to status 401 and anonymous actor")
    void mapsFailedLogin() {
        service.record(new AuthAuditEvent("login_failed", null, null, false, null));

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(repository).save(captor.capture());
        AuditLog log = captor.getValue();
        assertThat(log.getStatusCode()).isEqualTo(401);
        assertThat(log.getActor()).isEqualTo("anonymous");
        assertThat(log.getTargetId()).isNull();
        assertThat(log.getPath()).isEqualTo("/auth/login_failed");
    }
}
