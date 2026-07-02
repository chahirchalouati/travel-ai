package com.travelai.notification;

import com.travelai.notification.events.BookingCancelledEvent;
import com.travelai.notification.events.BookingConfirmedEvent;
import com.travelai.notification.events.EmailVerificationRequestedEvent;
import com.travelai.notification.events.PartnerWelcomeEvent;
import com.travelai.notification.events.PasswordResetRequestedEvent;
import com.travelai.notification.events.PaymentCompletedEvent;
import com.travelai.notification.events.PriceDropEvent;
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

    /** Sends the cancellation email with the refund breakdown. */
    @ApplicationModuleListener
    public void onBookingCancelled(BookingCancelledEvent event) {
        String subject = "Prenotazione annullata — " + event.destination();
        String body = buildBookingCancelledHtml(event);
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

    /** Notifies user when a watched flight/cruise drops in price. */
    @ApplicationModuleListener
    public void onPriceDrop(PriceDropEvent event) {
        String subject = "Prezzo in calo — " + event.label();
        String body = buildPriceDropHtml(event);
        emailService.sendHtml(event.userId(), event.userEmail(), subject, body);
    }

    /** Sends welcome email to a newly registered partner. */
    @ApplicationModuleListener
    public void onPartnerWelcome(PartnerWelcomeEvent event) {
        String subject = "Benvenuto in Travel AI — " + event.partnerName();
        String body = buildPartnerWelcomeHtml(event);
        emailService.sendHtml(event.partnerId(), event.contactEmail(), subject, body);
    }

    /** Sends the password reset link when a user requests one. */
    @ApplicationModuleListener
    public void onPasswordResetRequested(PasswordResetRequestedEvent event) {
        String subject = "Reimposta la tua password — Travel AI";
        String body = buildPasswordResetHtml(event);
        emailService.sendHtml(event.userId(), event.userEmail(), subject, body);
    }

    /** Sends the email verification link on registration or resend. */
    @ApplicationModuleListener
    public void onEmailVerificationRequested(EmailVerificationRequestedEvent event) {
        String subject = "Verifica il tuo indirizzo email — Travel AI";
        String body = buildEmailVerificationHtml(event);
        emailService.sendHtml(event.userId(), event.userEmail(), subject, body);
    }

    // ── HTML builders ─────────────────────────────────────────────────────

    private String buildPasswordResetHtml(PasswordResetRequestedEvent e) {
        return """
                <html><body style="font-family:sans-serif;color:#241C15;">
                <h2 style="color:#D9694C;">Reimposta la tua password</h2>
                <p>Ciao <strong>%s</strong>,</p>
                <p>Abbiamo ricevuto una richiesta di reimpostazione della password.
                   Il link è valido per <strong>1 ora</strong> e utilizzabile una sola volta.</p>
                <p><a href="%s" style="background:#D9694C;color:#fff;padding:10px 18px;
                   border-radius:8px;text-decoration:none;font-weight:bold;">Reimposta password</a></p>
                <p style="color:#8A7C6A;font-size:12px;">Se non hai richiesto tu la reimpostazione,
                   ignora questa email: la tua password resterà invariata.</p>
                </body></html>
                """
                .formatted(e.userName(), e.resetLink());
    }

    private String buildEmailVerificationHtml(EmailVerificationRequestedEvent e) {
        return """
                <html><body style="font-family:sans-serif;color:#241C15;">
                <h2 style="color:#D9694C;">Verifica il tuo indirizzo email</h2>
                <p>Ciao <strong>%s</strong>,</p>
                <p>Conferma il tuo indirizzo email per completare la configurazione del tuo account Travel AI.</p>
                <p><a href="%s" style="background:#D9694C;color:#fff;padding:10px 18px;
                   border-radius:8px;text-decoration:none;font-weight:bold;">Verifica email</a></p>
                <p style="color:#8A7C6A;font-size:12px;">Se non hai creato tu questo account, ignora questa email.</p>
                </body></html>
                """
                .formatted(e.userName(), e.verifyLink());
    }

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

    private String buildBookingCancelledHtml(BookingCancelledEvent e) {
        String refundLine = e.refundPercent() > 0
                ? "<p><strong>Rimborso (%d%%):</strong> €%.2f su €%.2f pagati.</p>"
                        .formatted(e.refundPercent(), e.refundAmount(), e.totalPaid())
                : "<p>Nessun rimborso previsto per questa cancellazione.</p>";
        return """
                <html><body style="font-family:sans-serif;color:#241C15;">
                <h2 style="color:#D9694C;">Prenotazione annullata</h2>
                <p>Ciao <strong>%s</strong>,</p>
                <p>La tua prenotazione per <strong>%s</strong> (rif. %s) è stata annullata.</p>
                %s
                <p style="color:#8A7C6A;font-size:12px;">Booking ID: %s</p>
                </body></html>
                """
                .formatted(
                        e.userName(),
                        e.destination(),
                        e.bookingReference(),
                        refundLine,
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

    private String buildPriceDropHtml(PriceDropEvent e) {
        return """
                <html><body style="font-family:sans-serif;color:#241C15;">
                <h2 style="color:#D9694C;">Il prezzo è sceso! 📉</h2>
                <p><strong>%s</strong></p>
                <p>Da <span style="text-decoration:line-through;color:#8A7C6A;">€%.2f</span>
                   a <strong style="color:#00856A;">€%.2f</strong>.</p>
                <p>Accedi all'app per prenotare prima che risalga.</p>
                </body></html>
                """
                .formatted(e.label(), e.oldPrice(), e.newPrice());
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
