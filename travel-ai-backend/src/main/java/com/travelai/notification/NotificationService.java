package com.travelai.notification;

import com.travelai.notification.events.BookingConfirmedEvent;
import com.travelai.notification.events.PartnerWelcomeEvent;
import com.travelai.notification.events.PaymentCompletedEvent;
import com.travelai.notification.events.WaitlistAvailableEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailService emailService;

    /** Sends booking confirmation email when a booking is confirmed. */
    @ApplicationModuleListener
    public void onBookingConfirmed(BookingConfirmedEvent event) {
        String subject = "Prenotazione confermata — " + event.destination();
        String body = buildBookingConfirmationHtml(event);
        emailService.sendHtml(event.userId(), event.userEmail(), subject, body);
    }

    /** Sends payment receipt after successful payment. */
    @ApplicationModuleListener
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        String subject = "Pagamento ricevuto — €" + event.amount();
        String body = buildPaymentReceiptHtml(event);
        emailService.sendHtml(event.userId(), event.userEmail(), subject, body);
    }

    /** Notifies user when a waitlisted hotel becomes available. */
    @ApplicationModuleListener
    public void onWaitlistAvailable(WaitlistAvailableEvent event) {
        String subject = "Disponibilità — " + event.hotelName();
        String body = buildWaitlistHtml(event);
        emailService.sendHtml(event.userId(), event.userEmail(), subject, body);
    }

    /** Sends welcome email to a newly registered partner. */
    @ApplicationModuleListener
    public void onPartnerWelcome(PartnerWelcomeEvent event) {
        String subject = "Benvenuto in Travel AI — " + event.partnerName();
        String body = buildPartnerWelcomeHtml(event);
        emailService.sendHtml(event.partnerId(), event.contactEmail(), subject, body);
    }

    // ── HTML builders ─────────────────────────────────────────────────────

    private String buildBookingConfirmationHtml(BookingConfirmedEvent e) {
        return """
                <html><body style="font-family:sans-serif;color:#241C15;">
                <h2 style="color:#D9694C;">Prenotazione confermata!</h2>
                <p>Ciao <strong>%s</strong>,</p>
                <p>La tua prenotazione per <strong>%s</strong> è confermata.</p>
                <p><strong>Hotel:</strong> %s</p>
                <p><strong>Totale:</strong> €%.2f</p>
                <p style="color:#8A7C6A;font-size:12px;">Booking ID: %s</p>
                </body></html>
                """
                .formatted(
                        e.userName(),
                        e.destination(),
                        e.hotelName(),
                        e.totalAmount(),
                        e.bookingId());
    }

    private String buildPaymentReceiptHtml(PaymentCompletedEvent e) {
        return """
                <html><body style="font-family:sans-serif;color:#241C15;">
                <h2 style="color:#D9694C;">Pagamento ricevuto</h2>
                <p>Importo: <strong>€%.2f</strong></p>
                <p>Tipo: %s</p>
                <p style="color:#8A7C6A;font-size:12px;">Payment ID: %s</p>
                </body></html>
                """
                .formatted(e.amount(), e.paymentType(), e.paymentId());
    }

    private String buildWaitlistHtml(WaitlistAvailableEvent e) {
        return """
                <html><body style="font-family:sans-serif;color:#241C15;">
                <h2 style="color:#D9694C;">Disponibilità!</h2>
                <p><strong>%s</strong> è disponibile dal %s al %s.</p>
                <p>Accedi all'app per completare la prenotazione.</p>
                </body></html>
                """
                .formatted(e.hotelName(), e.dateFrom(), e.dateTo());
    }

    private String buildPartnerWelcomeHtml(PartnerWelcomeEvent e) {
        return """
                <html><body style="font-family:sans-serif;color:#241C15;">
                <h2 style="color:#D9694C;">Benvenuto in Travel AI!</h2>
                <p>Ciao <strong>%s</strong>, la tua struttura è stata registrata con successo.</p>
                <p>Il team di Travel AI verificherà i tuoi dati a breve.</p>
                </body></html>
                """
                .formatted(e.partnerName());
    }
}
