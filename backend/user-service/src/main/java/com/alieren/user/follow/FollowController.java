package com.alieren.user.follow;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class FollowController {

    private final FollowService service;

    public FollowController(FollowService service) {
        this.service = service;
    }

    // Follow
    @PostMapping("/{targetId}/follow")
    public void follow(@RequestHeader("X-User-Id") String me,
                       @PathVariable String targetId) {
        service.follow(me, targetId);
    }

    // Unfollow
    @DeleteMapping("/{targetId}/follow")
    public void unfollow(@RequestHeader("X-User-Id") String me,
                         @PathVariable String targetId) {
        service.unfollow(me, targetId);
    }

    // Feed için gerekli: following id listesi
    @GetMapping("/me/following-ids")
    public List<String> myFollowingIds(@RequestHeader("X-User-Id") String me) {
        return service.getFollowingIds(me);
    }

    @GetMapping("/{userId}/followers-count")
    public long followersCount(@PathVariable String userId) {
        return service.getFollowersCount(userId);
    }

    @GetMapping("/{userId}/following-count")
    public long followingCount(@PathVariable String userId) {
        return service.getFollowingCount(userId);
    }
}
