package com.travelai.payment;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.event.PaymentCompletedEvent;
import com.travelai.payment.dto.InitiatePaymentRequest;
import com.travelai.payment.dto.PaymentResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public PaymentResponse initiatePayment(String userEmail, InitiatePaymentRequest req) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setBookingId(req.bookingId());
        payment.setAmount(req.amount());
        payment.setCurrency(req.currency() != null ? req.currency() : "EUR");
        payment.setGateway(req.gateway());
        payment.setType(req.type());
        payment.setStatus(PaymentStatus.PROCESSING);

        String gatewayRef = req.gateway().name().toLowerCase() + "_" + UUID.randomUUID().toString().substring(0, 12);
        String checkoutUrl = simulateCheckoutUrl(req.gateway(), gatewayRef);
        payment.setGatewayReference(gatewayRef);
        payment.setGatewayCheckoutUrl(checkoutUrl);

        return toResponse(paymentRepository.save(payment));
    }

    public PaymentResponse confirmPayment(String userEmail, UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PAYMENT_NOT_FOUND));

        if (!payment.getUser().getEmail().equals(userEmail)) {
            throw TravelAiException.forbidden(ErrorCode.ACCESS_DENIED);
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);

        eventPublisher.publishEvent(new PaymentCompletedEvent(
                saved.getId(), saved.getBookingId(), saved.getUser().getId(),
                saved.getUser().getEmail(), saved.getAmount(), saved.getType().name()
        ));

        log.info("Payment {} confirmed for booking {}", saved.getId(), saved.getBookingId());
        return toResponse(saved);
    }

    public PaymentResponse refundPayment(String userEmail, UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PAYMENT_NOT_FOUND));

        if (!payment.getUser().getEmail().equals(userEmail)) {
            throw TravelAiException.forbidden(ErrorCode.ACCESS_DENIED);
        }
        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw TravelAiException.badRequest(ErrorCode.PAYMENT_FAILED);
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setRefundedAt(LocalDateTime.now());
        return toResponse(paymentRepository.save(payment));
    }

    @Transactional(readOnly = true)
    public Page<PaymentResponse> getMyPayments(String email, Pageable pageable) {
        return paymentRepository.findByUserEmail(email, pageable).map(this::toResponse);
    }

    public void handleWebhook(PaymentGateway gateway, String rawBody, String eventType, String gatewayRef) {
        log.info("Webhook received: gateway={} eventType={} ref={}", gateway, eventType, gatewayRef);
        paymentRepository.findByGatewayReference(gatewayRef).ifPresent(payment -> {
            switch (eventType) {
                case "payment.completed", "PAYMENT_SALE_COMPLETED", "charge.succeeded" -> {
                    payment.setStatus(PaymentStatus.COMPLETED);
                    payment.setPaidAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                    eventPublisher.publishEvent(new PaymentCompletedEvent(
                            payment.getId(), payment.getBookingId(), payment.getUser().getId(),
                            payment.getUser().getEmail(), payment.getAmount(), payment.getType().name()
                    ));
                }
                case "charge.failed", "payment.failed" -> {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setFailureReason(eventType);
                    paymentRepository.save(payment);
                }
                default -> log.debug("Unhandled webhook event: {}", eventType);
            }
        });
    }

    private String simulateCheckoutUrl(PaymentGateway gateway, String ref) {
        return switch (gateway) {
            case STRIPE -> "https://checkout.stripe.com/pay/" + ref;
            case KLARNA -> "https://checkout.klarna.com/" + ref;
            case PAYPAL -> "https://www.paypal.com/checkoutnow?token=" + ref;
        };
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getId(), p.getBookingId(), p.getStatus(), p.getType(),
                p.getGateway(), p.getAmount(), p.getCurrency(), p.getGatewayReference(),
                p.getGatewayCheckoutUrl(), p.getPaidAt(), p.getCreatedAt()
        );
    }
}
