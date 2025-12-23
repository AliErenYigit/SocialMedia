package com.alieren.notification.dto;

import java.util.List;

public record UserBatchRequest(List<Long> ids) {}