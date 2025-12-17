package com.alieren.notification.notifications;

import com.alieren.notification.dto.NotificationResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationRepository repo;

    public NotificationController(NotificationRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/me")
    public List<NotificationResponse> myNotifications(@RequestHeader("X-User-Id") String me) {
        return repo.findByTargetUserIdOrderByCreatedAtDesc(me).stream()
                .map(n -> new NotificationResponse(
                        n.getId(), n.getType(), n.getActorUserId(),
                        n.getEntityType(), n.getEntityId(),
                        n.getCreatedAt(), n.isRead()
                )).toList();
    }

    @PatchMapping("/{id}/read")
    public void markRead(@RequestHeader("X-User-Id") String me, @PathVariable Long id) {
        Notification n = repo.findById(id).orElseThrow();
        if (!n.getTargetUserId().equals(me)) throw new RuntimeException("Forbidden");
        n.setRead(true);
        repo.save(n);
    }
}
