package com.teknex.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesExecutiveMatchResponse {
    private String dealId;
    private Long salesExecutiveId;
    private String salesExecutiveName;
    private String salesExecutiveEmail;
    private Long dealerId;
    private String dealerName;
    private String message;
}
