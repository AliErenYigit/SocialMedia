package com.alieren.api_gateway.security;

import io.jsonwebtoken.Claims;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Set;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private final GatewayJwtService jwtService;

    // auth endpointleri + health gibi public yerler
    private final Set<String> publicPaths = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/actuator/health"
    );

    public JwtAuthFilter(GatewayJwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        String path = exchange.getRequest().getURI().getPath();

        // CORS preflight (OPTIONS) isteklerini bloklama
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequest().getMethod().name())) {
            return chain.filter(exchange);
        }

        // public path ise geç
        if (isPublic(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = jwtService.validateAndGetClaims(token);

            // downstream servislerde kullanmak için header ekleyebiliriz:
            // (userId = sub)
            String userId = claims.getSubject();
            String email = claims.get("email", String.class);

            var mutated = exchange.getRequest().mutate()
                    .header("X-User-Id", userId)
                    .header("X-User-Email", email == null ? "" : email)
                    .build();

            return chain.filter(exchange.mutate().request(mutated).build());
        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private boolean isPublic(String path) {
        if (path.startsWith("/api/v1/auth/")) return true; // auth komple public
        return publicPaths.contains(path);
    }

    @Override
    public int getOrder() {
        return -1; // erken çalışsın
    }
}
