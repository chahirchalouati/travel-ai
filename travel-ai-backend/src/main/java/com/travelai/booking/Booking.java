package com.travelai.booking;

import com.travelai.auth.User;
import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;
import static jakarta.persistence.FetchType.LAZY;

@Entity
@Table(name = "bookings")
@Getter
@Setter
public class Booking extends BaseEntity {

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "proposal_id")
    private UUID proposalId;

    private UUID hotelId;
    private UUID restaurantId;
    private UUID flightId;

    @Enumerated(STRING)
    private BookingStatus status = BookingStatus.PENDING;

    private BigDecimal totalAmount;
    private BigDecimal hotelAmount;
    private BigDecimal restaurantAmount;
    private BigDecimal flightAmount;

    private String destination;
    private LocalDate checkIn;
    private LocalDate checkOut;

    @Column(name = "booking_reference", unique = true)
    private String bookingReference;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingTraveler> travelers = new ArrayList<>();
}
