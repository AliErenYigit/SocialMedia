package com.alieren.notification.dto;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String type,
        String actorUserId,
        String entityType,
        String entityId,
        Instant createdAt,
        boolean read
) {}
