package com.alieren.user.users;

import com.alieren.user.users.dto.UpdateMeRequest;
import com.alieren.user.users.dto.UserProfileResponse;
import com.alieren.user.users.dto.UserSummaryResponse;
import org.springframework.stereotype.Service;

import java.util.List;

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
                .orElseGet(() -> UserProfile.builder()
                        .authUserId(authUserId)
                        .build()
                );

        if (req.username() != null) p.setUsername(req.username());
        if (req.bio() != null) p.setBio(req.bio());
        if (req.avatarUrl() != null) p.setAvatarUrl(req.avatarUrl());

        p = repo.save(p);
        return toResponse(p);
    }

    private UserProfileResponse toResponse(UserProfile p) {
        return new UserProfileResponse(p.getAuthUserId(), p.getUsername(), p.getBio(), p.getAvatarUrl());
    }
    public List<UserSummaryResponse> getUsersByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();

        return repo.findByIdIn(ids).stream()
                .map(u -> new UserSummaryResponse(u.getId(), u.getUsername()))
                .toList();
    }




}
