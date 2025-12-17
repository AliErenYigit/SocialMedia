package com.alieren.user.follow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    boolean existsByFollowerAuthUserIdAndFollowingAuthUserId(String follower, String following);
    void deleteByFollowerAuthUserIdAndFollowingAuthUserId(String follower, String following);
    List<Follow> findByFollowerAuthUserId(String follower);
    long countByFollowerAuthUserId(String follower);
}
