package com.teknex.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthScoreRequest {
    private String dealId;
    private String dealDnaId;

    // Deal stage + progression (optional, but allows stage-aware scoring)
    private String status;
    private Boolean appointmentScheduled;
    private Boolean testDriveRequested;
    private Boolean testDriveCompleted;
    private Boolean financeDiscussed;
    private Boolean paperworkCompleted;
    private Boolean deliveryCompleted;
    private Boolean dealCompleted;
    private Boolean dealFailed;

    // Context used by the ML scorer (best-effort)
    private String interestCategory;
    private String budgetRange;
    private String intendedTimeframe;
    private String preferredContactMode;

    private Double salesExecutivePerformanceScore;
    private Integer totalInteractions;
    private Integer customerResponses;
    private Integer salesExecutiveFollowUps;
    private Double averageResponseTime;
}
