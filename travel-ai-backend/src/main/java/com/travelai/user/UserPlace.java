package com.travelai.user;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

/** A place pinned on a user's travel map. */
@Entity
@Table(name = "user_places")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPlace extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    private String country;

    private Double latitude;

    private Double longitude;

    private String note;

    @Column(name = "visited_on")
    private LocalDate visitedOn;
}
