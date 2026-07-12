package com.travelai.shared.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.framework.AopInfrastructureBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Implements {@link AopInfrastructureBean} so this servlet filter is categorically excluded
 * from AOP auto-proxying. Filters carry no business advice and are injected by concrete type
 * (see {@code SecurityConfig}); without this marker they can be spuriously wrapped in a JDK
 * dynamic proxy during the re-entrant advisor-initialisation window (observed under
 * spring-boot-devtools), which then breaks concrete-type injection.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter implements AopInfrastructureBean {

    private final StringRedisTemplate redisTemplate;

    private static final int MAX_REQUESTS = 60;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = getClientIp(request);
        String key = "ratelimit:global:" + ip;

        try {
            long now = System.currentTimeMillis();
            long windowStart = now - WINDOW.toMillis();
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);
            Long count = redisTemplate.opsForZSet().zCard(key);
            if (count != null && count >= MAX_REQUESTS) {
                log.warn("Rate limit exceeded for IP: {}", ip);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"error\":\"Too many requests. Please try again later.\"}");
                return;
            }
            redisTemplate.opsForZSet().add(key, String.valueOf(now), now);
            redisTemplate.expire(key, WINDOW);
        } catch (Exception e) {
            // Redis unavailable — fail open (don't block requests)
            log.warn("RateLimitFilter: Redis unavailable, skipping rate limit check: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
