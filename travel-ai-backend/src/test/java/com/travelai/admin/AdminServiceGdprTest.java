package com.travelai.admin;

import com.travelai.admin.dto.AdminSearchResponse;
import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.auth.UserRole;
import com.travelai.booking.BookingRepository;
import com.travelai.partner.PartnerRepository;
import com.travelai.payment.PaymentRepository;
import com.travelai.review.ReviewRepository;
import com.travelai.shared.config.JwtService;
import com.travelai.shared.exception.TravelAiException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceGdprTest {

    @Mock private UserRepository userRepository;
    @Mock private PartnerRepository partnerRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EntityManager entityManager;
    @Mock private JwtService jwtService;

    @InjectMocks
    private AdminService service;

    private User sampleUser(UUID id) {
        User u = new User();
        u.setEmail("jane@travelai.com");
        u.setFirstName("Jane");
        u.setLastName("Doe");
        u.setPhone("+39123");
        u.setRole(UserRole.TRAVELER);
        return u;
    }

    @Test
    @DisplayName("exportUserData returns the user's PII bundle")
    void exportBundle() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.of(sampleUser(id)));

        Map<String, Object> data = service.exportUserData(id);

        assertThat(data).containsEntry("email", "jane@travelai.com")
                .containsEntry("firstName", "Jane")
                .containsKey("exportedAt");
    }

    @Test
    @DisplayName("anonymizeUser scrubs PII and deactivates the account")
    void anonymize() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.of(sampleUser(id)));

        service.anonymizeUser(id);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).contains("@deleted.travelai");
        assertThat(saved.getFirstName()).isEqualTo("Deleted");
        assertThat(saved.getPhone()).isNull();
        assertThat(saved.isActive()).isFalse();
    }

    @Test
    @DisplayName("anonymizeUser throws when the user is missing")
    void anonymizeMissing() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.anonymizeUser(id)).isInstanceOf(TravelAiException.class);
        verify(userRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    @DisplayName("search returns empty groups for a blank query without hitting repositories")
    void searchBlankQuery() {
        AdminSearchResponse result = service.search("   ");

        assertThat(result.users()).isEmpty();
        assertThat(result.bookings()).isEmpty();
        assertThat(result.partners()).isEmpty();
        verify(userRepository, org.mockito.Mockito.never()).findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    @DisplayName("getBookingDetail throws when the booking is missing")
    void bookingDetailMissing() {
        UUID id = UUID.randomUUID();
        when(bookingRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getBookingDetail(id)).isInstanceOf(TravelAiException.class);
    }
}
