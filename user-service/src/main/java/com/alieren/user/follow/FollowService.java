package com.alieren.user.follow;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FollowService {

    private final FollowRepository repo;

    public FollowService(FollowRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public void follow(String followerId, String targetId) {
        if (followerId.equals(targetId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }
        if (repo.existsByFollowerAuthUserIdAndFollowingAuthUserId(followerId, targetId)) return;

        repo.save(Follow.builder()
                .followerAuthUserId(followerId)
                .followingAuthUserId(targetId)
                .build());
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
