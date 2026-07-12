package com.travelai.itinerary;

import com.travelai.itinerary.events.ItineraryProposalReadyEvent;
import com.travelai.notification.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * On a ready re-plan proposal: pushes a real-time SSE alert to the traveler's open
 * stream and sends an email notification via the shared {@link EmailService}.
 */
@Component
@RequiredArgsConstructor
public class ItineraryStreamListener {

    private final ItineraryStreamService streamService;
    private final EmailService emailService;

    @ApplicationModuleListener
    public void onProposalReady(ItineraryProposalReadyEvent event) {
        streamService.push(event.userEmail(), "proposal", Map.of(
                "proposalId", event.proposalId().toString(),
                "itineraryId", event.itineraryId().toString(),
                "summary", event.summary() == null ? "" : event.summary()));

        if (event.userId() != null && event.userEmail() != null) {
            emailService.sendHtml(
                    event.userId(),
                    event.userEmail(),
                    "Aggiornamento sul tuo viaggio — proposta di ripianificazione",
                    buildEmailHtml(event.summary()));
        }
    }

    private String buildEmailHtml(String summary) {
        String body = (summary == null || summary.isBlank())
                ? "Abbiamo trovato un'alternativa per un segmento interrotto del tuo viaggio."
                : summary;
        return """
                <html><body style="font-family:sans-serif;color:#241C15;">
                <h2 style="color:#D9694C;">Il tuo itinerario si è aggiornato</h2>
                <p>%s</p>
                <p>Accedi all'app per esaminare e approvare la proposta.</p>
                </body></html>
                """
                .formatted(body);
    }
}
