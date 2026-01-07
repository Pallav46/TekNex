package com.teknex.crm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "deals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deal {
    
    @Id
    private String id;
    
    private Long customerId;
    private String customerName;
    private String customerEmail;
    
    private Long salesExecutiveId;
    private String salesExecutiveName;
    
    private Long dealerId;
    private String dealerName;
    
    private String interestCategory; // SUV, Sedan, Hatchback, etc.
    private String budgetRange; // e.g., "10-15 lakhs"
    private String intendedTimeframe; // e.g., "1-2 months", "6+ months"
    private String preferredContactMode; // phone, call, skype, whatsapp
    
    // Deal lifecycle stage
    private DealStatus status; // INITIATED -> ... -> CLOSED/LOST
    
    private Double healthScore = 50.0; // 0-100
    private Double criticalThreshold = 30.0; // Low threshold - deal unlikely
    private Double opportunityThreshold = 70.0; // High threshold - offer premium services
    
    private Boolean testDriveOffered = false;
    private Boolean homeTestDriveOffered = false;
    private LocalDateTime appointmentDate;
    
    private List<String> notes; // Notes added by sales executive
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastContactedAt;
    
    public enum DealStatus {
        INITIATED,
        IN_PROGRESS,
        APPOINTMENT_SCHEDULED,
        TEST_DRIVE,
        FINANCIAL_INQUIRY,
        PAPERWORK,
        DELIVERY,
        CLOSED,
        LOST
    }
}
