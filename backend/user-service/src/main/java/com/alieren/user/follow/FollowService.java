package com.alieren.user.follow;

import com.alieren.shared.events.NotificationEvent;
import com.alieren.user.kafka.NotificationEventProducer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FollowService {

    private final FollowRepository repo;
    private final NotificationEventProducer producer;

    public FollowService(FollowRepository repo, NotificationEventProducer producer) {
        this.repo = repo;
        this.producer = producer;
    }

    @Transactional
    public void follow(String followerId, String targetId) {
        if (followerId.equals(targetId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        if (repo.existsByFollowerAuthUserIdAndFollowingAuthUserId(followerId, targetId)) {
            return;
        }

        repo.save(Follow.builder()
                .followerAuthUserId(followerId)
                .followingAuthUserId(targetId)
                .build());

        // ✅ FOLLOW_CREATED event
        producer.publish(new NotificationEvent(
                UUID.randomUUID().toString(),
                "FOLLOW_CREATED",
                followerId,     // actor
                targetId,       // target
                "USER",
                targetId,
                Instant.now(),
                Map.of("followerId", followerId)
        ));
    }

    @Transactional
    public void unfollow(String followerId, String targetId) {
        repo.deleteByFollowerAuthUserIdAndFollowingAuthUserId(followerId, targetId);
    }

    public List<String> getFollowingIds(String followerId) {
        return repo.findByFollowerAuthUserId(followerId)
                .stream()
                .map(Follow::getFollowingAuthUserId)
                .toList();
    }
}
