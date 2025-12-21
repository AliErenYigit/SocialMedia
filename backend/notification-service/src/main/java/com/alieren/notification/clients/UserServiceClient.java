package com.alieren.notification.clients;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.alieren.notification.dto.UserBatchRequest;
import com.alieren.notification.dto.UserSummaryResponse;

import java.util.List;
import java.util.Map;

@Component

public class UserServiceClient {

    private final WebClient webClient;

    public UserServiceClient(WebClient webClient) {
        this.webClient = webClient;
    }



    public Map<Long, String> getUsernames(List<Long> ids,String authHeader) {
        if (ids == null || ids.isEmpty()) return Map.of();

        return webClient.post()
                .uri("/api/v1/users/batch")
                .header("Authorization", authHeader == null ? "" : authHeader)
                .bodyValue(new UserBatchRequest(ids))
                .retrieve()
                .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                        r -> r.bodyToMono(String.class)
                                .map(body -> new RuntimeException("User-service error: " + r.statusCode() + " " + body)))
                .bodyToFlux(UserSummaryResponse.class)
                .collectMap(UserSummaryResponse::id, UserSummaryResponse::username)
                .block();

    }
}
