package com.alieren.chat.controller;

import com.alieren.chat.dto.PresencePayload;
import com.alieren.chat.service.PresenceService;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
public class PresenceWsController {

    private final PresenceService presenceService;

    public PresenceWsController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @MessageMapping("/app/presence.enter")
    public void enter(PresencePayload payload, @Header("X-User-Id") String me) {
        Long userId = Long.parseLong(me);
        presenceService.enter(userId, payload.getConversationId());
    }

    @MessageMapping("/app/presence.leave")
    public void leave(PresencePayload payload, @Header("X-User-Id") String me) {
        Long userId = Long.parseLong(me);
        presenceService.leave(userId, payload.getConversationId());
    }
}
