package com.travelai.admin;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.auth.UserRole;
import com.travelai.booking.BookingRepository;
import com.travelai.partner.PartnerRepository;
import com.travelai.review.ReviewRepository;
import com.travelai.shared.config.JwtService;
import com.travelai.shared.exception.TravelAiException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceImpersonationTest {

    @Mock private UserRepository userRepository;
    @Mock private PartnerRepository partnerRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EntityManager entityManager;
    @Mock private JwtService jwtService;

    @InjectMocks
    private AdminService service;

    private User user(UserRole role, boolean active) {
        User u = new User();
        u.setEmail("t@travelai.com");
        u.setFirstName("Tom");
        u.setLastName("Traveler");
        u.setRole(role);
        u.setActive(active);
        return u;
    }

    @Test
    @DisplayName("impersonate issues a token for an active non-admin user")
    void impersonateOk() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.of(user(UserRole.TRAVELER, true)));
        when(jwtService.generateAccessToken(org.mockito.ArgumentMatchers.any())).thenReturn("jwt-123");

        var res = service.impersonate(id);

        assertThat(res.accessToken()).isEqualTo("jwt-123");
        assertThat(res.role()).isEqualTo("TRAVELER");
    }

    @Test
    @DisplayName("impersonate refuses to impersonate another admin")
    void impersonateAdminBlocked() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.of(user(UserRole.ADMIN, true)));

        assertThatThrownBy(() -> service.impersonate(id)).isInstanceOf(TravelAiException.class);
    }

    @Test
    @DisplayName("impersonate refuses a deactivated user")
    void impersonateInactiveBlocked() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.of(user(UserRole.TRAVELER, false)));

        assertThatThrownBy(() -> service.impersonate(id)).isInstanceOf(TravelAiException.class);
    }
}
