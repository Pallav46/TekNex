package com.teknex.crm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "deal_dna")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealDNA {
    
    @Id
    private String id;
    
    private String dealId;
    
    // Customer Information
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    
    // Sales Executive Information
    private Long salesExecutiveId;
    private String salesExecutiveName;
    private Double salesExecutivePerformanceScore;
    
    // Dealer Information
    private Long dealerId;
    private String dealerName;
    private String dealerLocation;
    
    // Deal Preferences
    private String interestCategory;
    private String budgetRange;
    private String intendedTimeframe;
    private String preferredContactMode;
    
    // Deal Metrics
    private Double healthScore;
    private Double criticalThreshold;
    private Double opportunityThreshold;
    
    // Interaction Metrics
    private Integer totalInteractions;
    private Integer customerResponses;
    private Integer salesExecutiveFollowUps;
    private Double averageResponseTime; // in minutes
    
    // Engagement Indicators
    private Boolean testDriveRequested;
    private Boolean priceNegotiated;
    private Boolean financeDiscussed;
    private Boolean appointmentScheduled;
    
    // Additional Metadata
    private Map<String, Object> additionalData;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
