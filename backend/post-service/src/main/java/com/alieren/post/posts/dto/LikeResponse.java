package com.alieren.post.posts.dto;

public record LikeResponse(
        Long postId,
        boolean liked,
        long likeCount
) {}
