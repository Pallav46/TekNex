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
public class BotChatRequest {
    
    private Long customerId;
    
    @NotBlank(message = "Interest category is required")
    private String interestCategory; // SUV, Sedan, Hatchback, Electric, etc.
    
    @NotBlank(message = "Budget range is required")
    private String budgetRange; // e.g., "5-10 lakhs", "10-15 lakhs"
    
    @NotBlank(message = "Intended timeframe is required")
    private String intendedTimeframe; // e.g., "1-2 months", "3-5 months", "6+ months"
    
    @NotBlank(message = "Preferred contact mode is required")
    private String preferredContactMode; // phone, call, skype, whatsapp
}
