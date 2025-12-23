package com.alieren.auth.dto;

public record UserResponse(
        Long id,
        String email,
        String username
) {}
