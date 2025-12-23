package com.alieren.chat.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "conversations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user1Id", "user2Id"})
)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // küçük ID her zaman user1Id olsun (deterministic)
    @Column(nullable = false)
    private Long user1Id;

    @Column(nullable = false)
    private Long user2Id;

    @Column(nullable = false)
    private Instant createdAt;

    public Conversation() {}

    public Conversation(Long user1Id, Long user2Id, Instant createdAt) {
        this.user1Id = user1Id;
        this.user2Id = user2Id;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getUser1Id() { return user1Id; }
    public Long getUser2Id() { return user2Id; }
    public Instant getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setUser1Id(Long user1Id) { this.user1Id = user1Id; }
    public void setUser2Id(Long user2Id) { this.user2Id = user2Id; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
