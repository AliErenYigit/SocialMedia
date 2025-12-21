package com.alieren.chat.dto;

import java.time.Instant;

public record ConversationListItem(
        Long conversationId,
        Long peerUserId,
        String peerUsername,
        String peerAvatarUrl,
        String lastMessage,
        Instant lastMessageAt
) {}
