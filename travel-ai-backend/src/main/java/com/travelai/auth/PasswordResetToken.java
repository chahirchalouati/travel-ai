package com.travelai.auth;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(unique = true, nullable = false)
    private String token;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant usedAt;

    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public boolean isUsed() {
        return usedAt != null;
    }

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }

    public void markUsed() {
        this.usedAt = Instant.now();
    }
}
