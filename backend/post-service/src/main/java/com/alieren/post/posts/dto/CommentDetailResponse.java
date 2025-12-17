package com.alieren.post.posts.dto;

import java.time.Instant;

public record CommentDetailResponse(
        Long id,
        String authUserId,
        String username,
        String content,
        Instant createdAt
) {}
