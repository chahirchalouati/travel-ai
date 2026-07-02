package com.travelai.travel.budget;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

/** A manual extra expense the traveller logs against a trip (travel request). */
@Entity
@Table(name = "trip_expense")
@Getter
@Setter
public class TripExpense extends BaseEntity {

    @Column(name = "trip_id", nullable = false)
    private UUID tripId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(STRING)
    @Column(nullable = false)
    private TripExpenseCategory category;

    private String description;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "spent_on")
    private LocalDate spentOn;
}
