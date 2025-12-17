package com.alieren.post.posts.dto;

import java.time.Instant;
import java.util.List;

public record PostDetailResponse(
        Long id,
        String content,
        String authUserId,
        String username,
        Instant createdAt,
        long likeCount,
        List<CommentDetailResponse> comments
) {}
