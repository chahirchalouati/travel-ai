package com.travelai.travel;

import com.travelai.auth.User;
import com.travelai.shared.domain.BaseEntity;
import com.travelai.shared.domain.SpendingPriority;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static jakarta.persistence.FetchType.LAZY;

@Entity
@Table(name = "travel_requests")
@Getter
@Setter
public class TravelRequest extends BaseEntity {

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String destination;

    private LocalDate departureDate;

    private LocalDate returnDate;

    @Enumerated(EnumType.STRING)
    private DateMode dateMode;

    private Integer adultsCount;

    private Integer childrenCount;

    private BigDecimal budget;

    @Enumerated(EnumType.STRING)
    private SpendingPriority spendingPriority;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private List<String> constraints;

    private boolean active = true;
}
