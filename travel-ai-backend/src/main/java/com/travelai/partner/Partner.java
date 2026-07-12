package com.travelai.partner;

import com.travelai.auth.User;
import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

import static jakarta.persistence.EnumType.STRING;
import static jakarta.persistence.FetchType.LAZY;

@Entity
@Table(name = "partners")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Partner extends BaseEntity {

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(STRING)
    @Column(nullable = false)
    private PartnerType type;

    @Column(nullable = false)
    private String name;

    private String vatNumber;

    @Column(nullable = false)
    private String contactEmail;

    private String contactPhone;

    private String address;

    private String city;

    @Column(length = 3)
    @Builder.Default
    private String country = "ITA";

    private BigDecimal latitude;

    private BigDecimal longitude;

    @Enumerated(STRING)
    @Column(nullable = false)
    @Builder.Default
    private PartnerStatus status = PartnerStatus.REGISTERED;

    private BigDecimal qualityScore;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
