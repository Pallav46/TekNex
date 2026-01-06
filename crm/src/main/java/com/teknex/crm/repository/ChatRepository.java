package com.teknex.crm.repository;

import com.teknex.crm.model.Chat;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends MongoRepository<Chat, String> {
    List<Chat> findByDealId(String dealId);
    List<Chat> findByCustomerId(Long customerId);
    List<Chat> findBySalesExecutiveId(Long salesExecutiveId);
    List<Chat> findByChatType(Chat.ChatType chatType);
    List<Chat> findByDealIdAndChatType(String dealId, Chat.ChatType chatType);
}
