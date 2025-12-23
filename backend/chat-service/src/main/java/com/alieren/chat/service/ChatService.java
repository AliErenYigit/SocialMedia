package com.alieren.chat.service;

import com.alieren.chat.dto.MessageResponse;
import com.alieren.chat.dto.SendMessageRequest;
import com.alieren.chat.model.Message;
import com.alieren.chat.kafka.ChatNotificationEvents;
import com.alieren.chat.kafka.NotificationEventProducer;
import com.alieren.chat.repository.MessageRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class ChatService {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;
    private final NotificationEventProducer notificationProducer;

    public ChatService(
            MessageRepository messageRepository,
            SimpMessagingTemplate messagingTemplate,
            PresenceService presenceService,
            NotificationEventProducer notificationProducer
    ) {
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
        this.presenceService = presenceService;
        this.notificationProducer = notificationProducer;
    }

    public MessageResponse sendMessage(Long senderId, SendMessageRequest req) {

        // 1) DB’ye kaydet
        Message m = new Message();
        m.setConversationId(req.getConversationId());
        m.setSenderId(senderId);
        m.setRecipientId(req.getRecipientId());
        m.setContent(req.getContent());
        m.setCreatedAt(Instant.now());

        Message saved = messageRepository.save(m);

        MessageResponse payload = new MessageResponse(
                saved.getId(),
                saved.getConversationId(),
                saved.getSenderId(),
                saved.getRecipientId(),
                saved.getContent(),
                saved.getCreatedAt()
        );

        // 2) WS yayınla - aktif sohbet ekranı için
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + saved.getConversationId(),
                payload
        );

        // ✅ 2.1) Inbox yayınla - sohbet listesi/unread güncellemek için (kritik)
        // recipient sohbeti açmamış olsa bile chat sayfası açıkken bunu alacak
        messagingTemplate.convertAndSend(
                "/topic/users/" + saved.getRecipientId(),
                payload
        );

        // ✅ 2.2) (Önerilir) sender inbox’a da gönder
        // kullanıcı başka tab/cihazda chat ekranında ise listesi güncel kalsın
        messagingTemplate.convertAndSend(
                "/topic/users/" + saved.getSenderId(),
                payload
        );

        // 3) Alıcı o conversation ekranında değilse -> notification event
        boolean recipientInChat = presenceService.isViewingConversation(
                saved.getRecipientId(),
                saved.getConversationId()
        );

        if (!recipientInChat) {
            notificationProducer.publish(ChatNotificationEvents.messageCreated(saved));
        }

        System.out.println("DB saved -> id=" + saved.getId()
                + " convId=" + saved.getConversationId()
                + " sender=" + saved.getSenderId()
                + " recipient=" + saved.getRecipientId()
                + " content=" + saved.getContent());

        return payload;
    }

}
