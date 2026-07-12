package com.travelai.notification;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.auth.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationBroadcastServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationLogRepository notificationLogRepository;

    @InjectMocks
    private NotificationBroadcastService service;

    private User user(String email) {
        User u = new User();
        u.setEmail(email);
        return u;
    }

    @Test
    @DisplayName("broadcast to all active users writes one IN_APP log each")
    void broadcastAll() {
        when(userRepository.findByActiveTrue()).thenReturn(List.of(user("a@x.com"), user("b@x.com")));

        int count = service.broadcast("Maintenance", "We will be down at 2am", null);

        assertThat(count).isEqualTo(2);
        ArgumentCaptor<List<NotificationLog>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationLogRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).allSatisfy(l -> {
            assertThat(l.getChannel()).isEqualTo(NotificationChannel.IN_APP);
            assertThat(l.getStatus()).isEqualTo(NotificationStatus.SENT);
            assertThat(l.getSubject()).isEqualTo("Maintenance");
        });
    }

    @Test
    @DisplayName("broadcast filtered by role targets only that role")
    void broadcastByRole() {
        when(userRepository.findByRoleAndActiveTrue(UserRole.PARTNER)).thenReturn(List.of(user("p@x.com")));

        int count = service.broadcast("Partner update", "New commission terms", "PARTNER");

        assertThat(count).isEqualTo(1);
        verify(userRepository).findByRoleAndActiveTrue(UserRole.PARTNER);
    }

    @Test
    @DisplayName("broadcast rejects blank subject or body")
    void broadcastValidatesInput() {
        assertThatThrownBy(() -> service.broadcast("", "body", null))
                .isInstanceOf(IllegalArgumentException.class);
        verify(notificationLogRepository, never()).saveAll(any());
    }
}
