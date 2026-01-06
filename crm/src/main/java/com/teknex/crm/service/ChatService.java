package com.teknex.crm.service;

import com.teknex.crm.dto.ChatMessageRequest;
import com.teknex.crm.model.Chat;
import com.teknex.crm.repository.ChatRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class ChatService {
    
    @Autowired
    private ChatRepository chatRepository;
    
    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;
    
    public List<Chat> getChatsByDealId(String dealId) {
        return chatRepository.findByDealId(dealId);
    }
    
    public Chat getSalesExecutiveChatByDealId(String dealId) {
        List<Chat> chats = chatRepository.findByDealIdAndChatType(dealId, Chat.ChatType.SALES_EXECUTIVE);
        if (chats.isEmpty()) {
            throw new RuntimeException("Sales executive chat not found for deal: " + dealId);
        }
        return chats.get(0);
    }
    
    public Chat addMessage(ChatMessageRequest request) {
        List<Chat> chats = chatRepository.findByDealId(request.getDealId());
        
        // Find the sales executive chat
        Chat chat = chats.stream()
                .filter(c -> c.getChatType() == Chat.ChatType.SALES_EXECUTIVE)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Sales executive chat not found"));
        
        if (chat.getMessages() == null) {
            chat.setMessages(new ArrayList<>());
        }
        
        Chat.Message message = Chat.Message.builder()
                .senderId(request.getSenderId() != null ? request.getSenderId().toString() : "bot")
                .senderName(request.getSenderName())
                .senderType(Chat.Message.SenderType.valueOf(request.getSenderType().toUpperCase()))
                .content(request.getContent())
                .timestamp(LocalDateTime.now())
                .build();
        
        chat.getMessages().add(message);
        chat.setUpdatedAt(LocalDateTime.now());
        
        chat = chatRepository.save(chat);
        log.info("Message added to chat for deal: {}", request.getDealId());
        
        return chat;
    }
    
    public List<Chat> getChatsByCustomer(Long customerId) {
        return chatRepository.findByCustomerId(customerId);
    }
    
    public List<Chat> getChatsBySalesExecutive(Long salesExecutiveId) {
        return chatRepository.findBySalesExecutiveId(salesExecutiveId);
    }
}
