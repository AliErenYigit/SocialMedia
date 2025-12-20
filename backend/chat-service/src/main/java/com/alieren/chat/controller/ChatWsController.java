package com.alieren.chat.controller;

import com.alieren.chat.dto.SendMessageRequest;
import com.alieren.chat.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;

@Controller
public class ChatWsController {

    private final ChatService chatService;

    public ChatWsController(ChatService chatService) {
        this.chatService = chatService;
    }

    @MessageMapping("/chat.send")
    public void send(@Payload SendMessageRequest req, SimpMessageHeaderAccessor accessor) {

        String me = accessor.getFirstNativeHeader("X-User-Id");
        System.out.println("WS /chat.send header X-User-Id=" + me
                + " convId=" + req.getConversationId()
                + " recipientId=" + req.getRecipientId()
                + " content=" + req.getContent());

        if (me == null || me.isBlank()) {
            throw new RuntimeException("X-User-Id missing");
        }

        Long senderId = Long.parseLong(me);
        chatService.sendMessage(senderId, req);
    }
}
