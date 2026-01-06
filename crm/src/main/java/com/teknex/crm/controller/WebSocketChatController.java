package com.teknex.crm.controller;

import com.teknex.crm.dto.ChatMessageRequest;
import com.teknex.crm.model.Chat;
import com.teknex.crm.service.ChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
public class WebSocketChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    /**
     * Endpoint to send a message to a specific deal chat
     * Client sends to: /app/chat/{dealId}
     * Server broadcasts to: /topic/chat/{dealId}
     */
    @MessageMapping("/chat/{dealId}")
    public void sendMessage(@DestinationVariable String dealId, @Payload ChatMessageRequest message) {
        try {
            log.info("Received WebSocket message for deal: {} from {}", dealId, message.getSenderName());
            
            // Save message to database
            Chat updatedChat = chatService.addMessage(message);
            
            // Get the last message
            Chat.Message lastMessage = updatedChat.getMessages().get(updatedChat.getMessages().size() - 1);
            
            log.info("Broadcasting message to /topic/chat/{}", dealId);
            
            // Create response with dealId included
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("dealId", dealId);
            response.put("senderId", lastMessage.getSenderId());
            response.put("senderName", lastMessage.getSenderName());
            response.put("senderType", lastMessage.getSenderType().name());
            response.put("content", lastMessage.getContent());
            response.put("timestamp", lastMessage.getTimestamp().toString());
            
            // Broadcast to all subscribers of this deal's chat
            messagingTemplate.convertAndSend("/topic/chat/" + dealId, response);
            
        } catch (Exception e) {
            log.error("Error processing WebSocket message for deal {}: {}", dealId, e.getMessage(), e);
        }
    }

    /**
     * Endpoint to notify when sales executive joins chat
     */
    @MessageMapping("/chat/{dealId}/join")
    public void salesExecutiveJoined(@DestinationVariable String dealId, @Payload String salesExecutiveName) {
        try {
            log.info("Sales Executive {} joined chat for deal: {}", salesExecutiveName, dealId);
            
            // Notify all participants
            messagingTemplate.convertAndSend("/topic/chat/" + dealId + "/status", 
                salesExecutiveName + " has joined the chat");
                
        } catch (Exception e) {
            log.error("Error notifying join for deal {}: {}", dealId, e.getMessage(), e);
        }
    }
}
