package com.travelai.payment;

import com.travelai.auth.User;
import com.travelai.payment.dto.AdminPaymentResponse;
import com.travelai.shared.exception.TravelAiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceAdminTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private com.travelai.auth.UserRepository userRepository;
    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private PaymentService service;

    private Payment completedPayment() {
        User user = new User();
        user.setEmail("buyer@travelai.com");
        Payment p = new Payment();
        p.setUser(user);
        p.setBookingId(UUID.randomUUID());
        p.setAmount(new BigDecimal("120.00"));
        p.setStatus(PaymentStatus.COMPLETED);
        return p;
    }

    @Test
    @DisplayName("admin refund flips a completed payment to REFUNDED without ownership check")
    void adminRefundSucceeds() {
        UUID id = UUID.randomUUID();
        when(paymentRepository.findById(id)).thenReturn(Optional.of(completedPayment()));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));

        AdminPaymentResponse res = service.adminRefund(id);

        assertThat(res.status()).isEqualTo("REFUNDED");
        assertThat(res.refundedAt()).isNotNull();
        assertThat(res.userEmail()).isEqualTo("buyer@travelai.com");
    }

    @Test
    @DisplayName("admin refund rejects a payment that is not COMPLETED")
    void adminRefundRejectsNonCompleted() {
        UUID id = UUID.randomUUID();
        Payment pending = completedPayment();
        pending.setStatus(PaymentStatus.PENDING);
        when(paymentRepository.findById(id)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> service.adminRefund(id)).isInstanceOf(TravelAiException.class);
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("admin refund throws when the payment is missing")
    void adminRefundMissing() {
        UUID id = UUID.randomUUID();
        when(paymentRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.adminRefund(id)).isInstanceOf(TravelAiException.class);
    }
}
