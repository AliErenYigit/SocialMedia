package com.alieren.user.users.dto;

import java.util.List;

public record UserBatchRequest(
        List<Long> ids
) {}
