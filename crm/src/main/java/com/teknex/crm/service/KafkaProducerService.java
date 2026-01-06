package com.teknex.crm.service;

import com.teknex.crm.dto.HealthScoreRequest;
import com.teknex.crm.dto.SalesExecutiveMatchRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class KafkaProducerService {
    
    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;
    
    public void sendSalesExecutiveMatchRequest(SalesExecutiveMatchRequest request) {
        try {
            log.info("=== Sending sales executive match request to Kafka ===");
            log.info("Deal ID: {}", request.getDealId());
            log.info("Customer ID: {}", request.getCustomerId());
            log.info("Interest: {}, Budget: {}", request.getInterestCategory(), request.getBudgetRange());
            kafkaTemplate.send("sales-executive-match-request", request)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to send sales executive match request: {}", ex.getMessage(), ex);
                    } else {
                        log.info("Successfully sent sales executive match request for deal: {}", request.getDealId());
                    }
                });
        } catch (Exception e) {
            log.error("Exception while sending sales executive match request: {}", e.getMessage(), e);
        }
    }
    
    public void sendHealthScoreRequest(HealthScoreRequest request) {
        try {
            log.info("=== Sending health score request to Kafka ===");
            log.info("Deal ID: {}", request.getDealId());
            kafkaTemplate.send("health-score-request", request)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to send health score request: {}", ex.getMessage(), ex);
                    } else {
                        log.info("Successfully sent health score request for deal: {}", request.getDealId());
                    }
                });
        } catch (Exception e) {
            log.error("Exception while sending health score request: {}", e.getMessage(), e);
        }
    }
}
