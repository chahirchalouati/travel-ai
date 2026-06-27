package com.travelai.payment;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

@Entity
@Table(name = "payment_webhooks")
@Getter
@Setter
public class PaymentWebhook extends BaseEntity {

    @Column(name = "payment_id")
    private UUID paymentId;

    @Enumerated(STRING)
    private PaymentGateway gateway;

    private String eventType;

    @Column(columnDefinition = "text")
    private String payload;

    private boolean processed = false;

    private LocalDateTime processedAt;
}
