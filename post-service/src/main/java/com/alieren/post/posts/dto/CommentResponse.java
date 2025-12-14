package com.alieren.post.posts.dto;

import java.time.Instant;

public record CommentResponse(
        Long id,
        Long postId,
        String authUserId,
        String content,
        Instant createdAt
) {}
