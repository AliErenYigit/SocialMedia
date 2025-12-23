package com.alieren.chat.client;

public record UserProfileDto(
        Long id,
        String username,
        String avatarUrl
) {}
