package com.alieren.notification.dto;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String type,
        String actorUserId,
        String username,   // ✅ eklendi
        String entityId,        // ✅ entityType kaldırmak için sadece entityId tut
        Instant createdAt,
        boolean read,
        String message
) {}
