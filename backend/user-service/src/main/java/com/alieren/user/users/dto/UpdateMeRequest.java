package com.alieren.user.users.dto;

import jakarta.validation.constraints.Size;

public record UpdateMeRequest(
        @Size(min = 3, max = 30) String username,
        @Size(max = 500) String bio,
        String avatarUrl
) {}
