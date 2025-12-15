package com.alieren.post.clients;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Component
public class UserServiceClient {

    private final WebClient.Builder webClient;

    public UserServiceClient(WebClient.Builder webClient) {
        this.webClient = webClient;
    }

    public List<String> getMyFollowingIds(String userId) {
        return webClient.build()
                .get()
                .uri("http://USER-SERVICE/api/v1/users/me/following-ids")
                .header("X-User-Id", userId)
                .retrieve()
                .bodyToFlux(String.class)
                .collectList()
                .block();
    }
}
