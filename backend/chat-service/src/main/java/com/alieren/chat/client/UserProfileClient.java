package com.alieren.chat.client;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class UserProfileClient {

    private final WebClient webClient;

    public UserProfileClient(WebClient.Builder builder) {
        // gateway üzerinden çağırmak daha iyi (service discovery vs)
        this.webClient = builder.baseUrl("http://localhost:8080").build();
        // eğer gateway yoksa direkt user-service URL ver
        // this.webClient = builder.baseUrl("http://localhost:8085").build();
    }

    public UserProfileDto getProfile(Long userId, String bearerToken) {
        return webClient.get()
                .uri("/api/v1/users/{id}/profile", userId) // senin user-service endpointine göre düzenleyelim
                .header("Authorization", bearerToken != null ? bearerToken : "")
                .retrieve()
                .bodyToMono(UserProfileDto.class)
                .block();
    }
}
