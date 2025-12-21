package com.alieren.chat.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    // userId -> aktif conversationId
    private final ConcurrentHashMap<Long, Long> activeConversationByUser = new ConcurrentHashMap<>();

    public void enter(Long userId, Long conversationId) {
        activeConversationByUser.put(userId, conversationId);
    }

    public void leave(Long userId, Long conversationId) {
        activeConversationByUser.compute(userId, (k, v) -> {
            if (v == null) return null;
            if (v.equals(conversationId)) return null;
            return v;
        });
    }

    public boolean isViewingConversation(Long userId, Long conversationId) {
        Long active = activeConversationByUser.get(userId);
        return active != null && active.equals(conversationId);
    }
}
