package com.alieren.post.clients;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.alieren.post.posts.dto.UserBatchRequest;
import com.alieren.post.posts.dto.UserSummaryResponse;

import java.util.List;
import java.util.Map;

@Component
public class UserServiceClient {

    private final WebClient webClient;

    public UserServiceClient(WebClient webClient) {
        this.webClient = webClient;
    }

    public List<String> getMyFollowingIds(String userId) {
        return webClient
                .get()
                .uri("http://USER-SERVICE/api/v1/users/me/following-ids")
                .header("X-User-Id", userId)
                .retrieve()
                .bodyToFlux(String.class)
                .collectList()
                .block();
    }


    public Map<Long, String> getUsernames(List<Long> ids,String authHeader) {
        if (ids == null || ids.isEmpty()) return Map.of();

        return webClient
                .post()
                .uri("/api/v1/users/batch")
                .header("Authorization", authHeader == null ? "" : authHeader)
                .bodyValue(new UserBatchRequest(ids))
                .retrieve()
                .bodyToFlux(UserSummaryResponse.class)
                .collectMap(UserSummaryResponse::id, UserSummaryResponse::username)
                .block();
    }
}
