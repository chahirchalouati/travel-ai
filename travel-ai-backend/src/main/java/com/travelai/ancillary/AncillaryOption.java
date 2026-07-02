package com.travelai.ancillary;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * A sellable optional extra offered at checkout. A {@code null} vertical means the
 * option is offered on every booking vertical; otherwise it is offered only for the
 * matching vertical (flight / restaurant / cruise).
 */
@Entity
@Table(name = "ancillary_option")
@Getter
@Setter
public class AncillaryOption extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String label;

    private String description;

    /** flight | restaurant | cruise, or null for all verticals. */
    private String vertical;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private String currency = "EUR";

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
