package com.travelai.invoice;

import com.travelai.auth.User;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Renders a real invoice PDF through the production code path and writes it to
 * target/sample-invoice.pdf so the rendered form/style can be inspected. This
 * exercises Flying Saucer end-to-end without needing the running server.
 */
@ExtendWith(MockitoExtension.class)
class InvoiceRenderTest {

    @Mock private InvoiceRepository invoiceRepository;
    @Mock private BookingRepository bookingRepository;
    @InjectMocks private InvoiceService service;

    private void seedSellerConfig() {
        ReflectionTestUtils.setField(service, "sellerName", "Travel AI S.r.l.");
        ReflectionTestUtils.setField(service, "sellerVat", "IT01234567890");
        ReflectionTestUtils.setField(service, "sellerAddress", "Via Roma 1, 00185 Roma (RM), Italia");
        ReflectionTestUtils.setField(service, "vatRate", new BigDecimal("0.22"));
    }

    private User customer() {
        User u = mock(User.class);
        lenient().when(u.getId()).thenReturn(UUID.randomUUID());
        lenient().when(u.getEmail()).thenReturn("giulia.rossi@example.com");
        lenient().when(u.getFirstName()).thenReturn("Giulia");
        lenient().when(u.getLastName()).thenReturn("Rossi");
        return u;
    }

    private com.travelai.booking.BookingTraveler traveler(String first, String last) {
        var t = new com.travelai.booking.BookingTraveler();
        t.setFirstName(first);
        t.setLastName(last);
        return t;
    }

    private Booking booking(User u, String dest, String ref, String amount, String kind) {
        Booking b = new Booking();
        b.setUser(u);
        b.setDestination(dest);
        b.setBookingReference(ref);
        b.setTotalAmount(new BigDecimal(amount));
        b.setPartySize(2);
        b.getTravelers().add(traveler("Giulia", "Rossi"));
        b.getTravelers().add(traveler("Marco", "Bianchi"));
        switch (kind) {
            case "flight" -> {
                b.setFlightId(UUID.randomUUID());
                b.setFareClass("Standard");
                b.setCheckIn(java.time.LocalDate.of(2026, 7, 2));
            }
            case "restaurant" -> {
                b.setRestaurantId(UUID.randomUUID());
                b.setTimeSlot("20:00");
                b.setCheckIn(java.time.LocalDate.of(2026, 7, 2));
            }
            case "cruise" -> {
                b.setCruiseId(UUID.randomUUID());
                b.setCabinCategory("Balcony");
                b.setCheckIn(java.time.LocalDate.of(2026, 8, 1));
                b.setCheckOut(java.time.LocalDate.of(2026, 8, 8));
            }
            default -> { }
        }
        return b;
    }

    @Test
    @DisplayName("renders a consolidated trip invoice PDF to target/sample-invoice.pdf")
    void rendersTripInvoicePdf() throws Exception {
        seedSellerConfig();
        User u = customer();
        UUID trip = UUID.randomUUID();
        List<Booking> bookings = List.of(
                booking(u, "Roma", "TRV-0CED2A03", "84.80", "restaurant"),
                booking(u, "Milano", "TRV-CE0247A1", "94.34", "flight"),
                booking(u, "Barcelona", "TRV-3B61DE6E", "660.00", "cruise"));
        when(bookingRepository.findByTripGroupIdAndUserEmail(trip, u.getEmail())).thenReturn(bookings);
        when(invoiceRepository.findByTripGroupId(trip)).thenReturn(Optional.empty());
        when(invoiceRepository.countByNumberStartingWith(anyString())).thenReturn(122L);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

        InvoiceService.RenderedInvoice out = service.forTrip(u.getEmail(), trip);

        assertThat(out.number()).endsWith("/000123");
        assertThat(out.pdf()).isNotEmpty();
        // valid PDF header "%PDF"
        assertThat(new String(out.pdf(), 0, 4)).isEqualTo("%PDF");

        Path target = Path.of("target/sample-invoice.pdf");
        Files.write(target, out.pdf());
        System.out.println("WROTE INVOICE PDF: " + target.toAbsolutePath() + " (" + out.pdf().length + " bytes)");
    }
}
