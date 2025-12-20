package com.alieren.chat.dto;

public class SendMessageRequest {
    private Long conversationId;
    private Long recipientId;
    private String content;

    public SendMessageRequest() {}

    public Long getConversationId() { return conversationId; }
    public Long getRecipientId() { return recipientId; }
    public String getContent() { return content; }

    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }
    public void setContent(String content) { this.content = content; }
}
