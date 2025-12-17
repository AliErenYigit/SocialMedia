package com.alieren.shared.events;

import java.time.Instant;
import java.util.Map;

public record NotificationEvent(
        String eventId,
        String type,
        String actorUserId,
        String targetUserId,
        String entityType,
        String entityId,
        Instant createdAt,
        Map<String, Object> payload
) {}
