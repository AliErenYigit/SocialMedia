package com.alieren.post.posts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreatePostRequest(
        @NotBlank
        @Size(min = 1, max = 2000)
        Long id,
        String content,
        String imageUrl,   // ✅ yeni
        String authUserId,
        Instant createdAt
) {}
