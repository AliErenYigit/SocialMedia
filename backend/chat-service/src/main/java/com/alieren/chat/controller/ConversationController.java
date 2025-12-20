package com.alieren.chat.controller;

import com.alieren.chat.dto.ConversationCreateRequest;
import com.alieren.chat.dto.ConversationResponse;
import com.alieren.chat.model.Conversation;
import com.alieren.chat.repository.ConversationRepository;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/chat")
public class ConversationController {

    private final ConversationRepository repo;

    public ConversationController(ConversationRepository repo) {
        this.repo = repo;
    }

    @PostMapping("/conversations")
    public ConversationResponse findOrCreate(
            @RequestBody ConversationCreateRequest req,
            @RequestHeader("X-User-Id") String me
    ) {
        Long myId = Long.parseLong(me);
        Long otherId = req.getRecipientId();

        if (otherId == null) throw new RuntimeException("recipientId required");
        if (myId.equals(otherId)) throw new RuntimeException("cannot chat with yourself");

        Long u1 = Math.min(myId, otherId);
        Long u2 = Math.max(myId, otherId);

        Conversation c = repo.findByUser1IdAndUser2Id(u1, u2)
                .orElseGet(() -> repo.save(new Conversation(u1, u2, Instant.now())));

        return new ConversationResponse(c.getId());
    }
}