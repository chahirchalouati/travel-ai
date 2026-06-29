package com.travelai.itinerary;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Holds live Server-Sent-Events connections per user so the reactive itinerary can
 * push proposal alerts in real time. Emitters are cleaned up on completion/timeout/error.
 */
@Service
@Slf4j
public class ItineraryStreamService {

    private static final long TIMEOUT_MS = 30 * 60 * 1000L; // 30 minutes

    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String userEmail) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.computeIfAbsent(userEmail, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(userEmail, emitter));
        emitter.onTimeout(() -> remove(userEmail, emitter));
        emitter.onError(e -> remove(userEmail, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException ex) {
            remove(userEmail, emitter);
        }
        return emitter;
    }

    public void push(String userEmail, String eventName, Object payload) {
        List<SseEmitter> userEmitters = emitters.get(userEmail);
        if (userEmitters == null || userEmitters.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (IOException ex) {
                remove(userEmail, emitter);
            }
        }
    }

    private void remove(String userEmail, SseEmitter emitter) {
        List<SseEmitter> userEmitters = emitters.get(userEmail);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emitters.remove(userEmail);
            }
        }
    }
}
