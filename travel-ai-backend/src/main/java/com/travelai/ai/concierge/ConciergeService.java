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
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConciergeService {

    private final ChatClient chatClient;
    private final BookingRepository bookingRepository;

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
        try {
            String prompt = String.format(
                "Sei un concierge di viaggio italiano esperto. " +
                "Il cliente sta partendo per %s il %s e tornerà il %s. " +
                "Genera 3 consigli personalizzati e entusiasmanti in italiano su cosa fare, dove mangiare e cosa visitare. " +
                "Sii specifico, caldo e coinvolgente. Massimo 150 parole.",
                booking.getDestination() != null ? booking.getDestination() : "Italia",
                booking.getCheckIn(),
                booking.getCheckOut()
            );
            return chatClient.prompt(prompt).call().content();
        } catch (Exception e) {
            log.warn("AI suggestion failed for booking {}: {}", booking.getId(), e.getMessage());
            return "Il tuo viaggio a " + (booking.getDestination() != null ? booking.getDestination() : "destinazione") +
                   " si avvicina! Preparati per un'esperienza indimenticabile. " +
                   "Esplora i luoghi storici, assaggia la cucina locale e goditi ogni momento.";
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
