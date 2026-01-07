package com.teknex.crm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "deal_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealFeedback {

    @Id
    private String id;

    private String dealId;

    private Long customerId;
    private Long salesExecutiveId;

    // "customer" or "sales_executive"
    private String userType;

    private Integer rating; // 1-5
    private String comment;

    private LocalDateTime createdAt;
}
