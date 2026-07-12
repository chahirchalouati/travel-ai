package com.travelai.ai.planning;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class AiRateLimiter {

    private final StringRedisTemplate redisTemplate;
    private static final int MAX_REQUESTS = 10;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    public boolean tryAcquire(String userId) {
        String key = "ai:ratelimit:" + userId;
        long now = System.currentTimeMillis();
        long windowStart = now - WINDOW.toMillis();

        redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);
        Long count = redisTemplate.opsForZSet().zCard(key);
        if (count != null && count >= MAX_REQUESTS) {
            return false;
        }
        redisTemplate.opsForZSet().add(key, String.valueOf(now), now);
        redisTemplate.expire(key, WINDOW);
        return true;
    }
}
