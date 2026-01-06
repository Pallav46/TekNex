package com.teknex.crm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageRequest {
    
    @NotBlank(message = "Deal ID is required")
    private String dealId;
    
    private Long senderId;
    private String senderName;
    
    @NotBlank(message = "Sender type is required") // BOT, CUSTOMER, SALES_EXECUTIVE
    private String senderType;
    
    @NotBlank(message = "Message content is required")
    private String content;
}
