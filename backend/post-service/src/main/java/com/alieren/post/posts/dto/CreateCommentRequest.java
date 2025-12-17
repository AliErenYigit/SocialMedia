package com.alieren.post.posts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank
        @Size(min = 1, max = 1000)
        String content
) {}
