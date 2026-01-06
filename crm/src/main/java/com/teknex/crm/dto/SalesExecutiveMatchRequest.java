package com.teknex.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesExecutiveMatchRequest {
    private String dealId;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String interestCategory;
    private String budgetRange;
    private String intendedTimeframe;
    private String preferredContactMode;
}
