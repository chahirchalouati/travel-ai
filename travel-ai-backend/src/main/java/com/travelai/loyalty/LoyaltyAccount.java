package com.travelai.loyalty;

import com.travelai.auth.User;
import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.EnumType.STRING;

/** One loyalty account per user, holding the spendable and lifetime balances. */
@Entity
@Table(name = "loyalty_accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyAccount extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(name = "points_balance", nullable = false)
    private int pointsBalance = 0;

    @Builder.Default
    @Column(name = "lifetime_points", nullable = false)
    private int lifetimePoints = 0;

    @Builder.Default
    @Enumerated(STRING)
    @Column(nullable = false)
    private LoyaltyTier tier = LoyaltyTier.EXPLORER;
}
