package com.alieren.post.posts.dto;

import java.time.Instant;

public record PostResponse(
        Long id,
        String authUserId,
        String content,
        String ImageUrl,
        Instant createdAt,
        long likeCount,
        long commentCount
) {}
