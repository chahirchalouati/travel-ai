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

import java.util.UUID;

/** A photo in a user's personal gallery. */
@Entity
@Table(name = "user_photos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPhoto extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String url;

    private String caption;

    private String place;
}
