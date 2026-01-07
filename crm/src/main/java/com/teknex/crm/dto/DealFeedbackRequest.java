package com.teknex.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealFeedbackRequest {
    private String userType; // customer | sales_executive
    private Integer rating; // 1-5
    private String comment;
}
