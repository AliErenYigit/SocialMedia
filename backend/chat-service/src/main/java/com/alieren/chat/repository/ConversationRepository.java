package com.alieren.chat.repository;

import com.alieren.chat.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByUser1IdAndUser2Id(Long user1Id, Long user2Id);
    List<Conversation> findByUser1IdOrUser2Id(Long user1Id, Long user2Id);
}
