package com.alieren.chat.controller;

import com.alieren.chat.dto.MessageResponse;
import com.alieren.chat.model.Message;
import com.alieren.chat.repository.MessageRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/chat")
public class ChatRestController {

    private final MessageRepository messageRepository;

    public ChatRestController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<MessageResponse> messages(
            @PathVariable Long conversationId,
            @RequestHeader(value = "X-User-Id", required = false) String me // gateway varsa gelir
    ) {
        List<Message> list = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        return list.stream()
                .map(m -> new MessageResponse(
                        m.getId(),
                        m.getConversationId(),
                        m.getSenderId(),
                        m.getRecipientId(),
                        m.getContent(),
                        m.getCreatedAt()
                ))
                .toList();
    }
}
