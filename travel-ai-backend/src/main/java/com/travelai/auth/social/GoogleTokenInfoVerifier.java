package com.travelai.auth.social;

import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;
import java.util.Set;

/**
 * Verifies Google ID tokens by delegating to Google's public tokeninfo endpoint
 * ({@code https://oauth2.googleapis.com/tokeninfo?id_token=...}). Google performs
 * the signature and expiry checks; we additionally assert the audience matches
 * our configured client id and the issuer is Google. This avoids pulling in the
 * google-api-client dependency and keeps verification easy to mock in tests.
 *
 * <p>The client id is read from {@code app.oauth.google.client-id} (env
 * {@code GOOGLE_CLIENT_ID}), empty by default. When empty the feature is
 * considered disabled and every verify() call fails fast with a clear error.
 */
@Slf4j
@Component
public class GoogleTokenInfoVerifier implements GoogleTokenVerifier {

    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";
    private static final Set<String> VALID_ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final String clientId;
    private final RestClient restClient;

    public GoogleTokenInfoVerifier(
            @Value("${app.oauth.google.client-id:}") String clientId,
            RestClient.Builder restClientBuilder) {
        this.clientId = clientId == null ? "" : clientId.trim();
        this.restClient = restClientBuilder.baseUrl(TOKEN_INFO_URL).build();
    }

    @Override
    public boolean isConfigured() {
        return !clientId.isEmpty();
    }

    @Override
    public SocialIdentity verify(String idToken) {
        if (!isConfigured()) {
            log.warn("Google social login attempted but app.oauth.google.client-id is not configured");
            throw TravelAiException.badRequest(ErrorCode.SOCIAL_LOGIN_DISABLED);
        }

        Map<String, Object> claims = fetchTokenInfo(idToken);

        String audience = asString(claims.get("aud"));
        if (!clientId.equals(audience)) {
            log.warn("Google ID token audience mismatch (expected configured client id)");
            throw TravelAiException.unauthorized(ErrorCode.SOCIAL_TOKEN_INVALID);
        }

        String issuer = asString(claims.get("iss"));
        if (issuer == null || !VALID_ISSUERS.contains(issuer)) {
            log.warn("Google ID token has unexpected issuer: {}", issuer);
            throw TravelAiException.unauthorized(ErrorCode.SOCIAL_TOKEN_INVALID);
        }

        String subject = asString(claims.get("sub"));
        String email = asString(claims.get("email"));
        if (subject == null || subject.isBlank() || email == null || email.isBlank()) {
            log.warn("Google ID token missing sub or email claim");
            throw TravelAiException.unauthorized(ErrorCode.SOCIAL_TOKEN_INVALID);
        }

        boolean emailVerified = Boolean.parseBoolean(asString(claims.get("email_verified")));

        return new SocialIdentity(
                subject,
                email,
                asString(claims.get("given_name")),
                asString(claims.get("family_name")),
                emailVerified
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchTokenInfo(String idToken) {
        try {
            Map<String, Object> body = restClient.get()
                    .uri(uriBuilder -> uriBuilder.queryParam("id_token", idToken).build())
                    .retrieve()
                    .body(Map.class);
            if (body == null || body.isEmpty()) {
                throw TravelAiException.unauthorized(ErrorCode.SOCIAL_TOKEN_INVALID);
            }
            return body;
        } catch (RestClientException ex) {
            // Google answers 4xx for an invalid/expired token; treat any client-side
            // failure as an invalid token rather than leaking the upstream error.
            log.warn("Google tokeninfo verification failed: {}", ex.getMessage());
            throw TravelAiException.unauthorized(ErrorCode.SOCIAL_TOKEN_INVALID);
        }
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }
}
