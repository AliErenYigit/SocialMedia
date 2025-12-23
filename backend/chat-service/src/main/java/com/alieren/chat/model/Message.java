package com.alieren.chat.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long conversationId;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false)
    private Long recipientId;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false)
    private Instant createdAt;

    public Message() {}

    public Long getId() { return id; }
    public Long getConversationId() { return conversationId; }
    public Long getSenderId() { return senderId; }
    public Long getRecipientId() { return recipientId; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }
    public void setContent(String content) { this.content = content; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
