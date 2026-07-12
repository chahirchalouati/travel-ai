package com.travelai.shared.config;

import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties properties;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(UserDetails userDetails) {
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("");
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("role", role)
                .issuedAt(new Date(now))
                .expiration(new Date(now + properties.expirationMs()))
                .signWith(key())
                .compact();
    }

    public String generateRefreshToken(UserDetails userDetails) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date(now))
                .expiration(new Date(now + properties.refreshExpirationMs()))
                .signWith(key())
                .compact();
    }

    /** Claim marking a token's intended, scoped purpose (e.g. an MFA challenge). */
    private static final String PURPOSE_CLAIM = "purpose";
    private static final String MFA_PURPOSE = "mfa";
    /** Short-lived window for completing a 2FA challenge after password success. */
    private static final long MFA_TOKEN_TTL_MS = 5 * 60 * 1000L;

    /**
     * Mints a short-lived, single-purpose token identifying the user mid-login,
     * issued after the password check but before the 2FA code is verified.
     */
    public String generateMfaChallengeToken(String email) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(email)
                .claim(PURPOSE_CLAIM, MFA_PURPOSE)
                .issuedAt(new Date(now))
                .expiration(new Date(now + MFA_TOKEN_TTL_MS))
                .signWith(key())
                .compact();
    }

    /**
     * Validates an MFA challenge token and returns the subject email.
     * Throws {@code TOKEN_INVALID} when the signature, purpose or expiry fails.
     */
    public String extractMfaChallengeEmail(String token) {
        Claims claims = parseClaims(token);
        if (!MFA_PURPOSE.equals(claims.get(PURPOSE_CLAIM, String.class))) {
            throw TravelAiException.unauthorized(ErrorCode.TOKEN_INVALID);
        }
        if (claims.getExpiration() == null || claims.getExpiration().before(new Date())) {
            throw TravelAiException.unauthorized(ErrorCode.TOKEN_EXPIRED);
        }
        return claims.getSubject();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String email = extractEmail(token);
            return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("Token validation failed: {}", ex.getMessage());
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            Date expiration = extractClaim(token, Claims::getExpiration);
            return expiration.before(new Date());
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("Could not check token expiration: {}", ex.getMessage());
            return true;
        }
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = parseClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("Failed to parse JWT: {}", ex.getMessage());
            throw TravelAiException.unauthorized(ErrorCode.TOKEN_INVALID);
        }
    }
}
