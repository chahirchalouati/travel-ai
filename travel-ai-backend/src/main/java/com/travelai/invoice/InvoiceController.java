package com.travelai.invoice;

import com.travelai.invoice.InvoiceService.RenderedInvoice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<byte[]> forBooking(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID bookingId) {
        return pdf(invoiceService.forBooking(user.getUsername(), bookingId));
    }

    @GetMapping("/trip/{tripGroupId}")
    public ResponseEntity<byte[]> forTrip(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID tripGroupId) {
        return pdf(invoiceService.forTrip(user.getUsername(), tripGroupId));
    }

    private ResponseEntity<byte[]> pdf(RenderedInvoice invoice) {
        String filename = "fattura-" + invoice.number().replace('/', '-') + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(invoice.pdf());
    }
}
