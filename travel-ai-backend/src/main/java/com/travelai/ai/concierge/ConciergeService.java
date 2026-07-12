package com.travelai.ai.concierge;

import com.travelai.ai.concierge.dto.ConciergeRecommendation;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.booking.BookingStatus;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConciergeService {

    private final ChatClient chatClient;
    private final BookingRepository bookingRepository;
    private final VectorStore vectorStore;

    private static final int CONTEXT_TOP_K = 6;
    private static final double CONTEXT_SIMILARITY_THRESHOLD = 0.45;

    @Transactional(readOnly = true)
    public List<ConciergeRecommendation> getRecommendationsForUser(String userEmail) {
        LocalDate activationDate = LocalDate.now().plusDays(3);
        return bookingRepository.findByUserEmail(userEmail, Pageable.unpaged())
            .stream()
            .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
            .filter(b -> b.getCheckIn() != null
                && !b.getCheckIn().isAfter(activationDate)
                && !b.getCheckIn().isBefore(LocalDate.now()))
            .map(this::buildRecommendation)
            .toList();
    }

    @Transactional(readOnly = true)
    public ConciergeRecommendation getRecommendationForBooking(String userEmail, UUID bookingId) {
        Booking booking = bookingRepository.findByIdAndUserEmail(bookingId, userEmail)
            .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));
        return buildRecommendation(booking);
    }

    private ConciergeRecommendation buildRecommendation(Booking booking) {
        String aiSuggestion = generateAiSuggestion(booking);
        String weatherAdvice = weatherAdvice(booking.getCheckIn());
        String packingTips = packingTips(booking.getCheckIn());
        return new ConciergeRecommendation(
            booking.getId(),
            booking.getDestination(),
            booking.getCheckIn(),
            booking.getCheckOut(),
            aiSuggestion,
            weatherAdvice,
            packingTips
        );
    }

    private String generateAiSuggestion(Booking booking) {
        String destination = booking.getDestination() != null ? booking.getDestination() : "Italia";
        try {
            String context = retrieveDestinationContext(destination);
            String contextSection = context.isEmpty()
                ? ""
                : "\n\nUsa SOLO queste informazioni reali dal nostro catalogo (non inventare nomi di hotel, " +
                  "ristoranti o luoghi che non compaiono qui):\n" + context;

            String prompt = String.format(
                "Sei un concierge di viaggio italiano esperto. " +
                "Il cliente parte per %s il %s e torna il %s. " +
                "Genera 3 consigli personalizzati ed entusiasmanti in italiano su cosa fare, dove mangiare e cosa visitare. " +
                "Sii specifico, caldo e coinvolgente. Massimo 150 parole.%s",
                destination, booking.getCheckIn(), booking.getCheckOut(), contextSection
            );
            return chatClient.prompt(prompt).call().content();
        } catch (Exception e) {
            log.warn("AI suggestion failed for booking {}: {}", booking.getId(), e.getMessage());
            return "Il tuo viaggio a " + destination +
                   " si avvicina! Preparati per un'esperienza indimenticabile. " +
                   "Esplora i luoghi storici, assaggia la cucina locale e goditi ogni momento.";
        }
    }

    private String retrieveDestinationContext(String destination) {
        try {
            SearchRequest searchRequest = SearchRequest.builder()
                .query("Hotel, ristoranti e cose da fare a " + destination)
                .topK(CONTEXT_TOP_K)
                .similarityThreshold(CONTEXT_SIMILARITY_THRESHOLD)
                .build();
            List<Document> results = vectorStore.similaritySearch(searchRequest);
            if (results == null || results.isEmpty()) {
                return "";
            }
            return results.stream().map(Document::getText).collect(Collectors.joining("\n---\n"));
        } catch (Exception e) {
            log.warn("Concierge context retrieval failed for {}: {}", destination, e.getMessage());
            return "";
        }
    }

    private String weatherAdvice(LocalDate date) {
        if (date == null) return "Controlla le previsioni meteo prima di partire.";
        int month = date.getMonthValue();
        return switch (month) {
            case 12, 1, 2 -> "Inverno: porta un cappotto caldo, sciarpa e guanti. Temperatura media 2-10°C.";
            case 3, 4, 5 -> "Primavera: abbigliamento a strati consigliato. Temperatura media 12-20°C.";
            case 6, 7, 8 -> "Estate: t-shirt e pantaloni leggeri, protezione solare SPF 50+. Temperatura media 25-35°C.";
            case 9, 10, 11 -> "Autunno: porta una giacca leggera e un impermeabile. Temperatura media 10-20°C.";
            default -> "Controlla le previsioni meteo prima di partire.";
        };
    }

    private String packingTips(LocalDate date) {
        if (date == null) return "Documenti, caricatore, kit di pronto soccorso.";
        int month = date.getMonthValue();
        boolean isSummer = month >= 6 && month <= 8;
        return isSummer
            ? "Essenziali: passaporto/carta d'identità, crema solare, occhiali da sole, costume da bagno, scarpe comode, adattatore universale."
            : "Essenziali: passaporto/carta d'identità, abbigliamento a strati, impermeabile leggero, scarpe impermeabili, adattatore universale.";
    }

    @Transactional(readOnly = true)
    public List<Booking> findUpcomingDepartures() {
        LocalDate target = LocalDate.now().plusDays(3);
        return bookingRepository.findAll().stream()
            .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
            .filter(b -> target.equals(b.getCheckIn()))
            .toList();
    }
}
