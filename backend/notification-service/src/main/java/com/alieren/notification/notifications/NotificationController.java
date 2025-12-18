package com.alieren.notification.notifications;
import com.alieren.notification.clients.UserServiceClient;

import com.alieren.notification.dto.NotificationResponse;
import org.springframework.web.bind.annotation.*;


import java.util.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationRepository repo;
    private final UserServiceClient userServiceClient;

    public NotificationController(NotificationRepository repo, UserServiceClient userServiceClient) {
        this.repo = repo;
        this.userServiceClient=userServiceClient;
    }

    private Long toLongOrNull(String s) {
        try {
            return (s == null || s.isBlank()) ? null : Long.parseLong(s);
        } catch (Exception e) {
            return null;
        }
    }

    private String buildMessage(String type, String username) {
        return switch (type) {
            case "POST_LIKED" -> username + " senin postunu beğendi.";
            case "COMMENT_CREATED" -> username + " postuna yorum yaptı.";
            case "FOLLOW_CREATED" -> username + " seni takip etmeye başladı.";
            default -> username + " bir işlem yaptı.";
        };
    }

    @GetMapping("/me")
    public List<NotificationResponse> myNotifications(
            @RequestHeader("X-User-Id") String me,
            @RequestHeader("Authorization") String authHeader
    ) {
        var ids = repo.findByTargetUserIdOrderByCreatedAtDesc(me);

        // actor id’leri topla
        List<Long> actorIds = ids.stream()
                .map(n -> toLongOrNull(n.getActorUserId()))
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, String> usernames = actorIds.isEmpty()
                ? Map.of()
                : userServiceClient.getUsernames(actorIds, authHeader);



        return ids.stream()
                .map(n -> {
                    Long aid = toLongOrNull(n.getActorUserId());
                    String username = (aid == null) ? "User" : usernames.getOrDefault(aid, "User");
                    String msg = buildMessage(n.getType(), username);
                    return new NotificationResponse(
                            n.getId(),
                            n.getType(),
                            n.getActorUserId(),
                            username,                // ✅ actorUsername
                            n.getEntityId(),              // ✅ sadece entityId (entityType yok)
                            n.getCreatedAt(),
                            n.isRead(),
                            msg
                    );
                })
                .toList();
    }
    @PatchMapping("/{id}/read")
    public void markRead(@RequestHeader("X-User-Id") String me, @PathVariable Long id) {
        Notification n = repo.findById(id).orElseThrow();
        if (!n.getTargetUserId().equals(me)) throw new RuntimeException("Forbidden");
        n.setRead(true);
        repo.save(n);
    }
}
