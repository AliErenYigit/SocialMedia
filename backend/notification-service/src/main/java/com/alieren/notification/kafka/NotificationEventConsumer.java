package com.alieren.notification.kafka;

import com.alieren.notification.notifications.Notification;
import com.alieren.notification.notifications.NotificationRepository;
import com.alieren.shared.events.NotificationEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventConsumer {

    private final NotificationRepository repo;

    public NotificationEventConsumer(NotificationRepository repo) {
        this.repo = repo;
    }

    @KafkaListener(topics = "notification-events", groupId = "notification-service")
    public void consume(NotificationEvent event) {
        System.out.println("✅ CONSUMED -> " + event.type() + " target=" + event.targetUserId());
        // idempotency: aynı event iki kez gelirse yazma
        if (repo.existsByEventId(event.eventId())) return;

        // kendine bildirim istemiyorsan:
        if (event.actorUserId().equals(event.targetUserId())) return;

        repo.save(Notification.builder()
                .eventId(event.eventId())
                .type(event.type())
                .actorUserId(event.actorUserId())
                .targetUserId(event.targetUserId())
                .entityType(event.entityType())
                .entityId(event.entityId())
                .createdAt(event.createdAt())
                .read(false)
                .build());
    }
}
