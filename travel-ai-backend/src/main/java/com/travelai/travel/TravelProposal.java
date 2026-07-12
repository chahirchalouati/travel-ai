package com.travelai.travel;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static jakarta.persistence.FetchType.LAZY;

@Entity
@Table(name = "travel_proposals")
@Getter
@Setter
public class TravelProposal extends BaseEntity {

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "request_id")
    private TravelRequest request;

    @Enumerated(EnumType.STRING)
    private ProposalStatus status;

    private String destination;

    private UUID hotelId;

    private UUID restaurantId;

    private UUID flightId;

    private BigDecimal totalCost;

    private BigDecimal hotelCost;

    private BigDecimal restaurantCost;

    private BigDecimal flightCost;

    @Column(columnDefinition = "text")
    private String aiMotivation;

    private Integer rankScore;

    private boolean selected = false;

    private LocalDateTime expiresAt;
}
