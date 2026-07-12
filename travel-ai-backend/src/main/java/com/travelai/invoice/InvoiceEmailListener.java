package com.travelai.invoice;

import com.travelai.notification.EmailService;
import com.travelai.event.BookingConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** Emails the invoice PDF once a booking is confirmed. */
@Component
@RequiredArgsConstructor
@Slf4j
public class InvoiceEmailListener {

    private final InvoiceService invoiceService;
    private final EmailService emailService;

    @ApplicationModuleListener
    public void onBookingConfirmed(BookingConfirmedEvent event) {
        try {
            InvoiceService.RenderedInvoice inv = invoiceService.forBooking(event.userEmail(), event.bookingId());
            String subject = "Fattura " + inv.number();
            String body = """
                    <html><body style="font-family:sans-serif;color:#241C15;">
                    <h2 style="color:#D9694C;">La tua fattura</h2>
                    <p>In allegato trovi la fattura <strong>%s</strong> per la tua prenotazione a %s.</p>
                    </body></html>
                    """.formatted(inv.number(), event.destination());
            String filename = "fattura-" + inv.number().replace('/', '-') + ".pdf";
            emailService.sendHtmlWithPdf(event.userId(), event.userEmail(), subject, body, inv.pdf(), filename);
        } catch (RuntimeException ex) {
            log.warn("Failed to email invoice for booking {}", event.bookingId(), ex);
        }
    }
}
