package com.alieren.user.users;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByAuthUserId(String authUserId);
    boolean existsByAuthUserId(String authUserId);
}
