package com.travelai.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentWebhookRepository extends JpaRepository<PaymentWebhook, UUID> {
    List<PaymentWebhook> findByProcessedFalse();
    List<PaymentWebhook> findByGateway(PaymentGateway gateway);
}
