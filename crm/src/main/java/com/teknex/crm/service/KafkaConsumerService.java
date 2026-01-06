package com.teknex.crm.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teknex.crm.dto.HealthScoreResponse;
import com.teknex.crm.dto.SalesExecutiveMatchResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@Slf4j
public class KafkaConsumerService {
    
    @Autowired
    private DealService dealService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @KafkaListener(topics = "sales-executive-match-response", groupId = "crm-group")
    @Transactional
    public void consumeSalesExecutiveMatchResponse(String message) {
        try {
            log.info("=== Received sales executive match response from Kafka ===");
            log.info("Raw message: {}", message);
            
            // Parse the response
            Map<String, Object> responseMap = objectMapper.readValue(message, Map.class);
            
            String dealId = (String) responseMap.get("dealId");
            Long salesExecutiveId = ((Number) responseMap.get("salesExecutiveId")).longValue();
            
            log.info("Parsed - Deal ID: {}, Sales Executive ID: {}", dealId, salesExecutiveId);
            
            SalesExecutiveMatchResponse response = SalesExecutiveMatchResponse.builder()
                    .dealId(dealId)
                    .salesExecutiveId(salesExecutiveId)
                    .salesExecutiveName((String) responseMap.get("salesExecutiveName"))
                    .salesExecutiveEmail((String) responseMap.get("salesExecutiveEmail"))
                    .dealerId(((Number) responseMap.get("dealerId")).longValue())
                    .dealerName((String) responseMap.get("dealerName"))
                    .message((String) responseMap.get("message"))
                    .build();
            
            log.info("Processed match response - Assigning SE {} to deal {}", salesExecutiveId, dealId);
            
            // Assign sales executive to the deal
            dealService.assignSalesExecutive(dealId, salesExecutiveId);
            
            log.info("Successfully assigned sales executive to deal {}", dealId);
            
        } catch (Exception e) {
            log.error("Error processing sales executive match response: {}", e.getMessage(), e);
        }
    }
    
    @KafkaListener(topics = "health-score-response", groupId = "crm-group")
    @Transactional
    public void consumeHealthScoreResponse(String message) {
        try {
            log.info("=== Received health score response from Kafka ===");
            log.info("Raw message: {}", message);
            
            // Parse the response
            Map<String, Object> responseMap = objectMapper.readValue(message, Map.class);
            
            String dealId = (String) responseMap.get("dealId");
            Double healthScore = ((Number) responseMap.get("healthScore")).doubleValue();
            
            log.info("Parsed - Deal ID: {}, Health Score: {}", dealId, healthScore);
            
            HealthScoreResponse response = HealthScoreResponse.builder()
                    .dealId(dealId)
                    .healthScore(healthScore)
                    .criticalThreshold(((Number) responseMap.get("criticalThreshold")).doubleValue())
                    .opportunityThreshold(((Number) responseMap.get("opportunityThreshold")).doubleValue())
                    .recommendation((String) responseMap.get("recommendation"))
                    .build();
            
            log.info("Updating deal {} with health score: {}", dealId, healthScore);
            
            // Update deal with the new health score
            dealService.updateDealHealth(dealId, response);
            
            log.info("Successfully updated deal {} with health score", dealId);
            
        } catch (Exception e) {
            log.error("Error processing health score response: {}", e.getMessage(), e);
            log.error("Error processing health score response", e);
        }
    }
}
