package com.alieren.auth.service;

import com.alieren.auth.dto.AuthResponse;
import com.alieren.auth.dto.LoginRequest;
import com.alieren.auth.dto.RegisterRequest;
import com.alieren.auth.jwt.JwtService;
import com.alieren.auth.user.User;
import com.alieren.auth.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new RuntimeException("Email already in use");
        }

        String hash = passwordEncoder.encode(req.password());
        User saved = userRepository.save(new User(req.email(), req.username(), hash));

        String token = jwtService.generateAccessToken(saved.getId(), saved.getEmail());

        return new AuthResponse(token, "Bearer", saved.getId(), saved.getEmail(), saved.getUsername());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.isEnabled()) throw new RuntimeException("User disabled");

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtService.generateAccessToken(user.getId(), user.getEmail());
        return new AuthResponse(token, "Bearer", user.getId(), user.getEmail(), user.getUsername());
    }
}
