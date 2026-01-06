package com.teknex.crm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "chats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chat {
    
    @Id
    private String id;
    
    private String dealId;
    private Long customerId;
    private Long salesExecutiveId;
    
    private ChatType chatType; // BOT, SALES_EXECUTIVE
    
    private List<Message> messages;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public enum ChatType {
        BOT, SALES_EXECUTIVE
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Message {
        private String senderId; // "bot", customerId, or salesExecutiveId
        private String senderName;
        private SenderType senderType; // BOT, CUSTOMER, SALES_EXECUTIVE
        private String content;
        private LocalDateTime timestamp;
        
        public enum SenderType {
            BOT, CUSTOMER, SALES_EXECUTIVE
        }
    }
}
