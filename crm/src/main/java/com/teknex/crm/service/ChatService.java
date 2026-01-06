package com.teknex.crm.service;

import com.teknex.crm.dto.ChatMessageRequest;
import com.teknex.crm.model.Chat;
import com.teknex.crm.repository.ChatRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class ChatService {
    
    @Autowired
    private ChatRepository chatRepository;
    
    public Chat getChatByDealId(String dealId) {
        return chatRepository.findByDealId(dealId)
                .orElseThrow(() -> new RuntimeException("Chat not found for deal: " + dealId));
    }
    
    public Chat addMessage(ChatMessageRequest request) {
        Chat chat = chatRepository.findByDealId(request.getDealId())
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        
        if (chat.getMessages() == null) {
            chat.setMessages(new ArrayList<>());
        }
        
        Chat.Message message = Chat.Message.builder()
                .senderId(request.getSenderId() != null ? request.getSenderId().toString() : "bot")
                .senderName(request.getSenderName())
                .senderType(Chat.Message.SenderType.valueOf(request.getSenderType()))
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
