package com.alieren.chat.controller;

import com.alieren.chat.client.UserProfileClient;
import com.alieren.chat.dto.ConversationCreateRequest;
import com.alieren.chat.dto.ConversationListItem;
import com.alieren.chat.dto.ConversationResponse;
import com.alieren.chat.model.Conversation;
import com.alieren.chat.repository.ConversationRepository;
import com.alieren.chat.repository.MessageRepository;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/chat")
public class ConversationController {

    private final ConversationRepository repo;
    private final MessageRepository messageRepository;
    private final UserProfileClient profileClient;

    public ConversationController(ConversationRepository repo,MessageRepository messageRepository,UserProfileClient profileClient) {
        this.repo = repo;
        this.messageRepository=messageRepository;
        this.profileClient=profileClient;
    }

    @GetMapping("/get/conversations")
    public List<ConversationListItem> myConversations(
            @RequestHeader("X-User-Id") String me,
            @RequestHeader(value = "Authorization", required = false) String auth
    ) {
        Long myId = Long.parseLong(me);

        List<Conversation> conversations = repo.findByUser1IdOrUser2Id(myId, myId);

        return conversations.stream()
                .map(c -> {
                    Long peerId = c.getUser1Id().equals(myId) ? c.getUser2Id() : c.getUser1Id();

                    var lastOpt = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(c.getId());
                    if (lastOpt.isEmpty()) return null;

                    var last = lastOpt.get();

                    // ✅ profile’dan username + avatar al
                    String username = "user_" + peerId;
                    String avatarUrl = null;
                    try {
                        var p = profileClient.getProfile(peerId, auth);
                        if (p != null) {
                            if (p.username() != null) username = p.username();
                            avatarUrl = p.avatarUrl();
                        }
                    } catch (Exception ignored) {}

                    return new ConversationListItem(
                            c.getId(),
                            peerId,
                            username,
                            avatarUrl,
                            last.getContent(),
                            last.getCreatedAt()
                    );
                })
                .filter(x -> x != null)
                .sorted((a, b) -> b.lastMessageAt().compareTo(a.lastMessageAt()))
                .toList();
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