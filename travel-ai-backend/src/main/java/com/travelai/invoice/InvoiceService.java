package com.travelai.invoice;

import com.travelai.auth.User;
import com.travelai.booking.Booking;
import com.travelai.booking.BookingRepository;
import com.travelai.booking.BookingTraveler;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Issues fiscal invoices (progressive number + 22% VAT breakdown) for a single
 * booking or a consolidated trip group, rendered to PDF via Flying Saucer.
 * Styled to match the app (brand #E04A2F, ink #1a1a1a). The {@link Invoice} row
 * exists to keep the number stable; amounts are recomputed from the live
 * booking(s) at render time.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceService {

    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;

    @Value("${travelai.invoice.seller-name:Travel AI S.r.l.}")
    private String sellerName;
    @Value("${travelai.invoice.seller-vat:IT01234567890}")
    private String sellerVat;
    @Value("${travelai.invoice.seller-address:Via Roma 1, 00185 Roma (RM), Italia}")
    private String sellerAddress;
    @Value("${travelai.invoice.seller-email:fatture@travelai.example}")
    private String sellerEmail;
    @Value("${travelai.invoice.vat-rate:0.22}")
    private BigDecimal vatRate;

    /** Rendered invoice: stable number + PDF bytes. */
    public record RenderedInvoice(String number, byte[] pdf) {}

    private record Line(String title, String details, BigDecimal gross) {}

    public RenderedInvoice forBooking(String email, UUID bookingId) {
        Booking b = bookingRepository.findByIdAndUserEmail(bookingId, email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND));
        Invoice invoice = invoiceRepository.findByBookingId(bookingId)
                .orElseGet(() -> {
                    Invoice i = newInvoice(b.getUser().getId(), b.getTotalAmount());
                    i.setBookingId(bookingId);
                    return invoiceRepository.save(i);
                });
        return renderInvoice(invoice, List.of(b));
    }

    public RenderedInvoice forTrip(String email, UUID tripGroupId) {
        List<Booking> bookings = bookingRepository.findByTripGroupIdAndUserEmail(tripGroupId, email);
        if (bookings.isEmpty()) {
            throw TravelAiException.notFound(ErrorCode.BOOKING_NOT_FOUND);
        }
        BigDecimal gross = bookings.stream().map(Booking::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        Invoice invoice = invoiceRepository.findByTripGroupId(tripGroupId)
                .orElseGet(() -> {
                    Invoice i = newInvoice(bookings.get(0).getUser().getId(), gross);
                    i.setTripGroupId(tripGroupId);
                    return invoiceRepository.save(i);
                });
        return renderInvoice(invoice, bookings);
    }

    // ── internals ─────────────────────────────────────────────────────────

    private Invoice newInvoice(UUID userId, BigDecimal gross) {
        Invoice i = new Invoice();
        i.setNumber(nextNumber());
        i.setUserId(userId);
        i.setGrossAmount(gross);
        i.setNetAmount(net(gross));
        i.setVatAmount(gross.subtract(net(gross)));
        i.setVatRate(vatRate);
        return i;
    }

    private String nextNumber() {
        String prefix = Year.now() + "/";
        long seq = invoiceRepository.countByNumberStartingWith(prefix) + 1;
        return prefix + String.format("%06d", seq);
    }

    private BigDecimal net(BigDecimal gross) {
        return gross.divide(BigDecimal.ONE.add(vatRate), 2, RoundingMode.HALF_UP);
    }

    private RenderedInvoice renderInvoice(Invoice invoice, List<Booking> bookings) {
        List<Line> lines = bookings.stream().map(this::toLine).toList();
        Set<String> travellers = new LinkedHashSet<>();
        for (Booking b : bookings) {
            for (BookingTraveler t : b.getTravelers()) {
                String name = ((t.getFirstName() == null ? "" : t.getFirstName()) + " "
                        + (t.getLastName() == null ? "" : t.getLastName())).trim();
                if (!name.isEmpty()) {
                    travellers.add(name);
                }
            }
        }
        BigDecimal gross = lines.stream().map(Line::gross).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal net = net(gross);
        User u = bookings.get(0).getUser();

        String xhtml = buildXhtml(invoice.getNumber(), u, travellers, lines, net, gross.subtract(net), gross);
        try {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(xhtml);
            renderer.layout();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            renderer.createPDF(out);
            return new RenderedInvoice(invoice.getNumber(), out.toByteArray());
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to render invoice PDF " + invoice.getNumber(), ex);
        }
    }

    private Line toLine(Booking b) {
        String kind;
        if (b.getFlightId() != null) {
            kind = "Volo";
        } else if (b.getRestaurantId() != null) {
            kind = "Ristorante";
        } else if (b.getCruiseId() != null) {
            kind = "Crociera";
        } else if (b.getHotelId() != null) {
            kind = "Hotel";
        } else {
            kind = "Prenotazione";
        }
        String title = kind + (b.getDestination() != null ? " · " + b.getDestination() : "");

        List<String> bits = new ArrayList<>();
        if (b.getCheckIn() != null && b.getCheckOut() != null) {
            bits.add(D.format(b.getCheckIn()) + " – " + D.format(b.getCheckOut()));
        } else if (b.getCheckIn() != null) {
            bits.add(D.format(b.getCheckIn()));
        }
        if (b.getTimeSlot() != null) {
            bits.add("ore " + b.getTimeSlot());
        }
        if (b.getFareClass() != null) {
            bits.add("Tariffa " + b.getFareClass());
        }
        if (b.getCabinCategory() != null) {
            bits.add("Cabina " + b.getCabinCategory());
        }
        if (b.getPartySize() != null) {
            bits.add(b.getPartySize() + (b.getPartySize() == 1 ? " persona" : " persone"));
        }
        bits.add("rif. " + b.getBookingReference());
        return new Line(title, String.join(" · ", bits), b.getTotalAmount());
    }

    private String buildXhtml(String number, User u, Set<String> travellers,
                              List<Line> lines, BigDecimal net, BigDecimal vat, BigDecimal gross) {
        int vatPct = vatRate.multiply(BigDecimal.valueOf(100)).intValueExact();

        StringBuilder rows = new StringBuilder();
        for (Line l : lines) {
            BigDecimal lineNet = net(l.gross());
            rows.append("""
                    <tr>
                      <td><span class="ln-title">%s</span><br/><span class="muted">%s</span></td>
                      <td class="r">%s</td>
                      <td class="r muted">%s</td>
                      <td class="r b">%s</td>
                    </tr>
                    """.formatted(esc(l.title()), esc(l.details()),
                    money(lineNet), money(l.gross().subtract(lineNet)), money(l.gross())));
        }

        String travellersHtml = travellers.isEmpty() ? ""
                : "<div class=\"section\"><div class=\"label\">Viaggiatori</div><div>"
                + esc(String.join(", ", travellers)) + "</div></div>";

        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <html><head><style>
                  @page { size: A4; margin: 2cm; }
                  body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 11px; line-height: 1.5; }
                  .brand { font-size: 20px; font-weight: bold; letter-spacing: -0.5px; }
                  .brand .ai { color: #E04A2F; }
                  .rule { height: 3px; background: #E04A2F; margin: 6px 0 0; }
                  .head { width: 100%%; }
                  .head td { vertical-align: top; border: none; padding: 0; }
                  .doc { text-align: right; }
                  .doc .h { font-size: 22px; font-weight: bold; }
                  .muted { color: #8a8a8a; }
                  .b { font-weight: bold; }
                  .parties { width: 100%%; margin-top: 22px; }
                  .parties td { vertical-align: top; width: 50%%; border: none; padding: 0 10px 0 0; }
                  .box { border: 1px solid #e8e8e8; border-radius: 8px; padding: 12px 14px; }
                  .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; color: #8a8a8a; margin-bottom: 4px; }
                  table.items { width: 100%%; border-collapse: collapse; margin-top: 22px; }
                  table.items th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8a8a; border-bottom: 2px solid #1a1a1a; padding: 6px 6px; }
                  table.items td { border-bottom: 1px solid #eee; padding: 9px 6px; }
                  .ln-title { font-weight: bold; }
                  .r { text-align: right; }
                  .section { margin-top: 16px; }
                  .totals { width: 46%%; margin-left: 54%%; margin-top: 14px; border-collapse: collapse; }
                  .totals td { padding: 4px 6px; border: none; }
                  .totals .grand td { font-size: 15px; font-weight: bold; border-top: 2px solid #1a1a1a; padding-top: 8px; }
                  .pay { margin-top: 18px; }
                  .paid { display: inline-block; background: #E1ECE5; color: #00856A; font-weight: bold; border-radius: 999px; padding: 4px 12px; font-size: 10px; }
                  .foot { margin-top: 30px; border-top: 1px solid #e8e8e8; padding-top: 10px; color: #8a8a8a; font-size: 9px; }
                </style></head><body>

                  <table class="head"><tr>
                    <td>
                      <div class="brand">Travel<span class="ai">AI</span></div>
                      <div class="muted" style="margin-top:8px;">%s<br/>P.IVA %s<br/>%s<br/>%s</div>
                    </td>
                    <td class="doc">
                      <div class="h">Fattura</div>
                      <div class="muted">N. <span class="b" style="color:#1a1a1a;">%s</span></div>
                      <div class="muted">Data emissione: %s</div>
                    </td>
                  </tr></table>
                  <div class="rule"></div>

                  <table class="parties"><tr>
                    <td><div class="box"><div class="label">Intestata a</div>
                        <div class="b">%s</div><div class="muted">%s</div></div></td>
                    <td><div class="box"><div class="label">Riepilogo</div>
                        <div>%d %s</div><div class="muted">IVA %d%% inclusa</div></div></td>
                  </tr></table>

                  <table class="items">
                    <thead><tr>
                      <th>Descrizione</th><th class="r">Imponibile</th><th class="r">IVA %d%%</th><th class="r">Totale</th>
                    </tr></thead>
                    <tbody>%s</tbody>
                  </table>

                  %s

                  <table class="totals">
                    <tr><td>Imponibile</td><td class="r">%s</td></tr>
                    <tr><td>IVA %d%%</td><td class="r">%s</td></tr>
                    <tr class="grand"><td>Totale</td><td class="r">%s</td></tr>
                  </table>

                  <div class="pay"><span class="label">Pagamento</span> &#160; <span class="paid">Pagato</span>
                    <span class="muted">&#160; Carta &#183; addebito unico</span></div>

                  <div class="foot">Documento generato automaticamente da %s (%s). Importi in EUR, IVA inclusa dove indicato.
                    Documento di cortesia, non sostituisce la fattura fiscale elettronica.</div>
                </body></html>
                """.formatted(
                esc(sellerName), esc(sellerVat), esc(sellerAddress), esc(sellerEmail),
                esc(number), D.format(LocalDate.now()),
                esc(customerName(u)), esc(u.getEmail()),
                lines.size(), lines.size() == 1 ? "servizio" : "servizi", vatPct,
                vatPct,
                rows.toString(),
                travellersHtml,
                money(net), vatPct, money(vat), money(gross),
                esc(sellerName), esc(sellerEmail));
    }

    private String customerName(User u) {
        String name = ((u.getFirstName() != null ? u.getFirstName() : "") + " "
                + (u.getLastName() != null ? u.getLastName() : "")).trim();
        return name.isEmpty() ? u.getEmail() : name;
    }

    private String money(BigDecimal v) {
        return "&#8364; " + v.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String esc(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
