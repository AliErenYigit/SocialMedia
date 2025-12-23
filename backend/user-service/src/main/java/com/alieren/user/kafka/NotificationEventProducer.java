package com.alieren.user.kafka; // user-service'te package'i uygun yap

import com.alieren.shared.events.NotificationEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventProducer {

    private final KafkaTemplate<String, NotificationEvent> kafkaTemplate;

    public NotificationEventProducer(KafkaTemplate<String, NotificationEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publish(NotificationEvent event) {
        kafkaTemplate.send("notification-events", event.targetUserId(), event);
    }
}
