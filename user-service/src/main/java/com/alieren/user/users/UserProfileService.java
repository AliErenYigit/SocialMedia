package com.alieren.user.users;

import com.alieren.user.users.dto.UpdateMeRequest;
import com.alieren.user.users.dto.UserProfileResponse;
import org.springframework.stereotype.Service;

@Service
public class UserProfileService {

    private final UserProfileRepository repo;

    public UserProfileService(UserProfileRepository repo) {
        this.repo = repo;
    }

    public UserProfileResponse getMe(String authUserId) {
        UserProfile p = repo.findByAuthUserId(authUserId)
                .orElseGet(() -> repo.save(UserProfile.builder()
                        .authUserId(authUserId)
                        .username("user_" + authUserId)
                        .bio("")
                        .avatarUrl(null)
                        .build()));

        return toResponse(p);
    }

    public UserProfileResponse updateMe(String authUserId, UpdateMeRequest req) {
        UserProfile p = repo.findByAuthUserId(authUserId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        if (req.username() != null) p.setUsername(req.username());
        if (req.bio() != null) p.setBio(req.bio());
        if (req.avatarUrl() != null) p.setAvatarUrl(req.avatarUrl());

        p = repo.save(p);
        return toResponse(p);
    }

    private UserProfileResponse toResponse(UserProfile p) {
        return new UserProfileResponse(p.getAuthUserId(), p.getUsername(), p.getBio(), p.getAvatarUrl());
    }
}
