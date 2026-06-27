package com.travelai.payment;

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

    @PostMapping("/stripe")
    public ResponseEntity<Void> stripeWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        String eventType = extractStripeEventType(rawBody);
        String ref = extractStripeRef(rawBody);
        paymentService.handleWebhook(PaymentGateway.STRIPE, rawBody, eventType, ref);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/paypal")
    public ResponseEntity<Void> paypalWebhook(@RequestBody String rawBody) {
        paymentService.handleWebhook(PaymentGateway.PAYPAL, rawBody, "PAYMENT_SALE_COMPLETED", extractPaypalRef(rawBody));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/klarna")
    public ResponseEntity<Void> klarnaWebhook(@RequestBody String rawBody) {
        paymentService.handleWebhook(PaymentGateway.KLARNA, rawBody, "payment.completed", extractKlarnaRef(rawBody));
        return ResponseEntity.ok().build();
    }

    private String extractStripeEventType(String body) {
        return extractJsonField(body, "type", "charge.succeeded");
    }

    private String extractStripeRef(String body) {
        return extractJsonField(body, "id", "unknown");
    }

    private String extractPaypalRef(String body) {
        return extractJsonField(body, "id", "unknown");
    }

    private String extractKlarnaRef(String body) {
        return extractJsonField(body, "order_id", "unknown");
    }

    private String extractJsonField(String json, String field, String defaultValue) {
        try {
            String marker = "\"" + field + "\"";
            int idx = json.indexOf(marker);
            if (idx < 0) return defaultValue;
            int colon = json.indexOf(':', idx);
            int start = json.indexOf('"', colon) + 1;
            int end = json.indexOf('"', start);
            return json.substring(start, end);
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
