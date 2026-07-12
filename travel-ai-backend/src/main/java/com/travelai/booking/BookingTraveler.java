package com.travelai.booking;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import static jakarta.persistence.FetchType.LAZY;

@Entity
@Table(name = "booking_travelers")
@Getter
@Setter
public class BookingTraveler extends BaseEntity {

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    private String firstName;
    private String lastName;
    private String documentNumber;
    private boolean isPrimary = false;
}
