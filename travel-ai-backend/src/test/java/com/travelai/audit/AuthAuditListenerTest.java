package com.travelai.audit;

import com.travelai.event.AuthAuditEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthAuditListenerTest {

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthAuditListener listener;

    @Test
    @DisplayName("delegates the auth event to the audit service")
    void delegatesToAuditService() {
        AuthAuditEvent event = new AuthAuditEvent("logout", "user@travelai.com", "id-1", true, null);

        listener.onAuthAudit(event);

        verify(auditService).record(event);
    }

    @Test
    @DisplayName("swallows audit failures so the auth flow is never broken")
    void swallowsExceptions() {
        AuthAuditEvent event = new AuthAuditEvent("login", "user@travelai.com", null, true, null);
        doThrow(new RuntimeException("db down")).when(auditService).record(event);

        assertThatCode(() -> listener.onAuthAudit(event)).doesNotThrowAnyException();
    }
}
