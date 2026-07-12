package com.travelai.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/webhooks/payment")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    @PostMapping("/stripe")
    public ResponseEntity<Void> stripeWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        try {
            JsonNode node = objectMapper.readTree(rawBody);
            String eventType = node.path("type").asText("charge.succeeded");
            String ref = node.path("id").asText("unknown");
            paymentService.handleWebhook(PaymentGateway.STRIPE, rawBody, eventType, ref);
        } catch (Exception e) {
            log.warn("Failed to parse Stripe webhook body: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/paypal")
    public ResponseEntity<Void> paypalWebhook(@RequestBody String rawBody) {
        try {
            JsonNode node = objectMapper.readTree(rawBody);
            String ref = node.path("id").asText("unknown");
            paymentService.handleWebhook(PaymentGateway.PAYPAL, rawBody, "PAYMENT_SALE_COMPLETED", ref);
        } catch (Exception e) {
            log.warn("Failed to parse PayPal webhook body: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/klarna")
    public ResponseEntity<Void> klarnaWebhook(@RequestBody String rawBody) {
        try {
            JsonNode node = objectMapper.readTree(rawBody);
            String ref = node.path("order_id").asText("unknown");
            paymentService.handleWebhook(PaymentGateway.KLARNA, rawBody, "payment.completed", ref);
        } catch (Exception e) {
            log.warn("Failed to parse Klarna webhook body: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }
}
