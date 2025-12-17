package com.alieren.user.follow;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "follows",
        uniqueConstraints = @UniqueConstraint(columnNames = {"followerAuthUserId", "followingAuthUserId"}))
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Takip eden (JWT sub)
    @Column(nullable = false, updatable = false)
    private String followerAuthUserId;

    // Takip edilen (JWT sub)
    @Column(nullable = false, updatable = false)
    private String followingAuthUserId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }
}
