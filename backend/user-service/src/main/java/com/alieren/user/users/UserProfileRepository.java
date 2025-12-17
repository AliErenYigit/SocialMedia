package com.alieren.user.users;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByAuthUserId(String authUserId);
    boolean existsByAuthUserId(String authUserId);
    List<UserProfile> findByIdIn(List<Long> ids);
}
