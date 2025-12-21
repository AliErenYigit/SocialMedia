package com.alieren.chat.dto;

import java.time.Instant;

public class MessageResponse {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private Long recipientId;
    private String content;
    private Instant createdAt;

    public MessageResponse() {}

    public MessageResponse(Long id, Long conversationId, Long senderId, Long recipientId, String content, Instant createdAt) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.content = content;
        this.createdAt = createdAt;
    }

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
