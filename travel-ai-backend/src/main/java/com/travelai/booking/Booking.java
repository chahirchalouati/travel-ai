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
    private UUID cruiseId;

    @Enumerated(STRING)
    private BookingStatus status = BookingStatus.PENDING;

    private BigDecimal totalAmount;
    private BigDecimal hotelAmount;
    private BigDecimal restaurantAmount;
    private BigDecimal flightAmount;
    private BigDecimal cruiseAmount;

    private String destination;
    private LocalDate checkIn;
    private LocalDate checkOut;

    /** Vertical-specific configuration captured by the booking funnel. */
    @Column(name = "fare_class")
    private String fareClass;        // flights: Basic / Standard / Flex

    @Column(name = "time_slot")
    private String timeSlot;         // restaurants: reserved time, e.g. "19:30"

    @Column(name = "cabin_category")
    private String cabinCategory;    // cruises: Interior / Ocean View / Balcony / Suite

    @Column(name = "party_size")
    private Integer partySize;       // travellers / covers / guests

    /** Shared across bookings created together in one bundle checkout. */
    @Column(name = "trip_group_id")
    private UUID tripGroupId;

    @Column(name = "booking_reference", unique = true)
    private String bookingReference;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingTraveler> travelers = new ArrayList<>();
}
