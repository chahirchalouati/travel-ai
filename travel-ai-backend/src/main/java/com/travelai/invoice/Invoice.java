package com.travelai.invoice;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/** A fiscal invoice (progressive number + VAT breakdown) for a booking or a trip group. */
@Entity
@Table(name = "invoice")
@Getter
@Setter
public class Invoice extends BaseEntity {

    /** Progressive number, e.g. "2026/000123". */
    @Column(nullable = false, unique = true)
    private String number;

    @Column(name = "booking_id")
    private UUID bookingId;

    @Column(name = "trip_group_id")
    private UUID tripGroupId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "net_amount", nullable = false)
    private BigDecimal netAmount;

    @Column(name = "vat_amount", nullable = false)
    private BigDecimal vatAmount;

    @Column(name = "gross_amount", nullable = false)
    private BigDecimal grossAmount;

    @Column(name = "vat_rate", nullable = false)
    private BigDecimal vatRate;
}
