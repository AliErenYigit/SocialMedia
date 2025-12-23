package com.alieren.chat.kafka;

import com.alieren.chat.model.Message;
import com.alieren.shared.events.NotificationEvent;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public final class ChatNotificationEvents {

    private ChatNotificationEvents() {}

    public static NotificationEvent messageCreated(Message m) {
        return new NotificationEvent(
                UUID.randomUUID().toString(),          // eventId
                "MESSAGE_CREATED",                     // type
                String.valueOf(m.getSenderId()),       // actorUserId
                String.valueOf(m.getRecipientId()),    // targetUserId
                "CONVERSATION",                        // entityType
                String.valueOf(m.getConversationId()), // entityId
                Instant.now(),
                Map.of(
                        "conversationId", m.getConversationId(),
                        "senderId", m.getSenderId()
                )
        );
    }
}
