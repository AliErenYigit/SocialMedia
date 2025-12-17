package com.alieren.user.users.dto;

public record UserProfileResponse(
        String authUserId,
        String username,
        String bio,
        String avatarUrl
) {}
