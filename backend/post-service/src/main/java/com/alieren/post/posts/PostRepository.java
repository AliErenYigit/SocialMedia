package com.alieren.post.posts;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc();
    List<Post> findByAuthUserIdOrderByCreatedAtDesc(String authUserId);

    // FEED: takip edilenlerin postları
    List<Post> findByAuthUserIdInOrderByCreatedAtDesc(List<String> authUserIds);
}
