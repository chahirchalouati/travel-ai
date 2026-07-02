package com.travelai.loyalty;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

/** Ledger entry on a loyalty account. Points are signed (earn +, redeem −). */
@Entity
@Table(name = "loyalty_transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private LoyaltyAccount account;

    @Enumerated(STRING)
    @Column(nullable = false)
    private LoyaltyTransactionType type;

    @Column(nullable = false)
    private int points;

    @Column(name = "booking_id")
    private UUID bookingId;

    private String description;
}
