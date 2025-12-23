package com.alieren.chat.dto;

public class ConversationResponse {
    private Long conversationId;

    public ConversationResponse() {}
    public ConversationResponse(Long conversationId) {
        this.conversationId = conversationId;
    }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
}
