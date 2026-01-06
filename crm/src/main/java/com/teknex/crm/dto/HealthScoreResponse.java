package com.teknex.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthScoreResponse {
    private String dealId;
    private Double healthScore;
    private Double criticalThreshold;
    private Double opportunityThreshold;
    private String recommendation;
}
