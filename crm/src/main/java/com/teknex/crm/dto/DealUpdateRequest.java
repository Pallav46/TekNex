package com.teknex.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealUpdateRequest {
    
    private String dealId;
    private String status; // INITIATED, IN_PROGRESS, APPOINTMENT_SCHEDULED, CLOSED, LOST
    private Double healthScore;
    private Boolean testDriveOffered;
    private Boolean homeTestDriveOffered;
    private LocalDateTime appointmentDate;
    private String note;
}
