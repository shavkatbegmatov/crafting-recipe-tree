package com.crafttree.service;

import com.crafttree.dto.PresenceDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Chatda kim onlayn ekanini kuzatadi. WebSocket sessiyalari {@code sessionId → username}
 * sifatida saqlanadi; bir foydalanuvchi bir nechta sessiyada bo'lishi mumkin (unique nomlar).
 * Har o'zgarishda onlayn ro'yxat {@code /topic/chat.presence}'ga e'lon qilinadi.
 */
@Service
@RequiredArgsConstructor
public class ChatPresenceService {

    private final SimpMessagingTemplate messaging;
    private final Map<String, String> sessionUsers = new ConcurrentHashMap<>();

    public void join(String sessionId, String username) {
        if (sessionId == null || username == null) {
            return;
        }
        sessionUsers.put(sessionId, username);
        broadcast();
    }

    public void leave(String sessionId) {
        if (sessionId != null && sessionUsers.remove(sessionId) != null) {
            broadcast();
        }
    }

    /** Joriy onlayn holat — takrorlanmas nomlar, alifbo tartibida. */
    public PresenceDto snapshot() {
        List<String> users = new ArrayList<>(new TreeSet<>(sessionUsers.values()));
        return new PresenceDto(users, users.size());
    }

    private void broadcast() {
        messaging.convertAndSend("/topic/chat.presence", snapshot());
    }
}
