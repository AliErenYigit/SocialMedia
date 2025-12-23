package com.alieren.chat.dto;

public class ConversationCreateRequest {
    private Long recipientId;

    public ConversationCreateRequest() {}

    public Long getRecipientId() { return recipientId; }
    public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }
}
