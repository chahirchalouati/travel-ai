package com.travelai.catalog.hotel;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "hotel_availability")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotelAvailability {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    private LocalDate date;

    private short roomsAvailable;

    private BigDecimal priceNight;
}
