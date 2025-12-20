package com.alieren.chat.dto;

public class PresencePayload {
    private Long conversationId;

    public PresencePayload() {}

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
}
