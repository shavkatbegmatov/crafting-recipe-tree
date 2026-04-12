package com.crafttree.controller;

import com.crafttree.dto.ChatMessageDto;
import com.crafttree.dto.ChatSendRequest;
import com.crafttree.entity.ChatMessage;
import com.crafttree.entity.User;
import com.crafttree.repository.ChatMessageRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Collections;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Real-time global chat")
public class ChatController {

    private final ChatMessageRepository chatRepo;
    private final SimpMessagingTemplate messaging;

    /**
     * REST: Fetch the last N chat messages (for initial load / scrollback).
     * Returned in chronological order (oldest first).
     */
    @GetMapping("/api/chat/messages")
    @Operation(summary = "Get recent chat messages")
    public List<ChatMessageDto> getMessages(
            @RequestParam(defaultValue = "50") int limit) {

        limit = Math.min(limit, 200); // cap
        List<ChatMessageDto> msgs = chatRepo.findAllWithUser(PageRequest.of(0, limit))
                .map(ChatMessageDto::from)
                .getContent();

        // Repo returns DESC; reverse to chronological order for the client
        Collections.reverse(msgs);
        return msgs;
    }

    /**
     * STOMP: Receive a message from an authenticated user and broadcast
     * it to all subscribers on /topic/chat.
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatSendRequest request, Principal principal) {
        if (principal == null) {
            log.warn("Unauthenticated user tried to send a chat message");
            return;
        }

        String content = request.getContent();
        if (content == null || content.isBlank() || content.length() > 2000) {
            return; // silently drop invalid
        }

        User user = extractUser(principal);
        if (user == null) {
            return;
        }

        ChatMessage entity = ChatMessage.builder()
                .user(user)
                .content(content.trim())
                .build();
        chatRepo.save(entity);

        ChatMessageDto dto = ChatMessageDto.from(entity);
        messaging.convertAndSend("/topic/chat", dto);
        log.debug("Chat from {}: {}", user.getUsername(), content.trim());
    }

    private User extractUser(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            Object p = auth.getPrincipal();
            if (p instanceof User u) {
                return u;
            }
        }
        return null;
    }
}
