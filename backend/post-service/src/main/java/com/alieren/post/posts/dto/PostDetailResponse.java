package com.alieren.post.posts.dto;

import java.time.Instant;
import java.util.List;

public record PostDetailResponse(
        Long id,
        String content,
        String authUserId,
        String username,
        String ImageUrl,
        Instant createdAt,
        boolean liked,
        long likeCount,
        List<CommentDetailResponse> comments
) {}
