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

    private String linkTypeOf(String type) {
        return switch (type) {
            case "POST_LIKED", "COMMENT_CREATED" -> "POST";
            case "FOLLOW_CREATED" -> "PROFILE";
            case "MESSAGE_CREATED" -> "DM";
            default -> "NOTIFICATIONS";
        };
    }

    private String linkIdOf(Notification n) {
        // POST: entityId postId
        if ("POST_LIKED".equals(n.getType()) || "COMMENT_CREATED".equals(n.getType())) {
            return n.getEntityId(); // postId
        }

        // FOLLOW: actorUserId ile profile'a gideriz
        if ("FOLLOW_CREATED".equals(n.getType())) {
            return n.getActorUserId(); // userId
        }

        // MESSAGE: burada iki seçenek var:
        // ✅ En doğrusu: entityId = conversationId/chatId
        // (Eğer event tarafında bunu set ediyorsan direkt n.getEntityId() yeter)
        if ("MESSAGE_CREATED".equals(n.getType())) {
            // 1) conversationId/chatId varsa entityId'den dön
            if (n.getEntityId() != null && !n.getEntityId().isBlank()) {
                return n.getEntityId();
            }
            // 2) yoksa DM user bazlı route için actorUserId dön (frontend bunu /messages/u/:id yapar)
            return n.getActorUserId();
        }

        return null;
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
            case "MESSAGE_CREATED" -> username + "sana bir mesaj yolladı.";
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

                    // ✅ boşluk fix
                    String msg = switch (n.getType()) {
                        case "POST_LIKED" -> username + " senin postunu beğendi.";
                        case "COMMENT_CREATED" -> username + " postuna yorum yaptı.";
                        case "FOLLOW_CREATED" -> username + " seni takip etmeye başladı.";
                        case "MESSAGE_CREATED" -> username + " sana bir mesaj yolladı.";
                        default -> username + " bir işlem yaptı.";
                    };

                    String linkType = linkTypeOf(n.getType());
                    String linkId = linkIdOf(n);

                    return new NotificationResponse(
                            n.getId(),
                            n.getType(),
                            n.getActorUserId(),
                            username,
                            n.getEntityId(),
                            n.getCreatedAt(),
                            n.isRead(),
                            msg,
                            linkType,
                            linkId
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
