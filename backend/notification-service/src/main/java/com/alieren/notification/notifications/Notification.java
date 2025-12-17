package com.alieren.notification.notifications;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notifications_target_created", columnList = "targetUserId,createdAt")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private String eventId;

    @Column(nullable = false, updatable = false)
    private String type;

    @Column(nullable = false, updatable = false)
    private String actorUserId;

    @Column(nullable = false, updatable = false)
    private String targetUserId;

    @Column(nullable = false, updatable = false)
    private String entityType;

    @Column(nullable = false, updatable = false)
    private String entityId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private boolean read;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        // default read=false
    }
}
