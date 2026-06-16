package com.crafttree.config;

import com.crafttree.service.ChatPresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

/**
 * STOMP ulanish/uzilish hodisalarini tinglab, chat onlayn-holatini yangilab boradi.
 * Principal {@link WebSocketAuthInterceptor} tomonidan CONNECT'da o'rnatiladi.
 */
@Component
@RequiredArgsConstructor
public class ChatPresenceListener {

    private final ChatPresenceService presenceService;

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = accessor.getUser();
        if (user != null) {
            presenceService.join(accessor.getSessionId(), user.getName());
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        presenceService.leave(event.getSessionId());
    }
}
