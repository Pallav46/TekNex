package com.teknex.crm.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teknex.crm.dto.HealthScoreResponse;
import com.teknex.crm.dto.SalesExecutiveMatchResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class KafkaConsumerService {
    
    @Autowired
    private DealService dealService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @KafkaListener(topics = "sales-executive-match-response", groupId = "crm-group")
    public void consumeSalesExecutiveMatchResponse(String message) {
        try {
            log.info("Received sales executive match response: {}", message);
            
            // Parse the response
            Map<String, Object> responseMap = objectMapper.readValue(message, Map.class);
            
            String dealId = (String) responseMap.get("dealId");
            Long salesExecutiveId = ((Number) responseMap.get("salesExecutiveId")).longValue();
            
            SalesExecutiveMatchResponse response = SalesExecutiveMatchResponse.builder()
                    .dealId(dealId)
                    .salesExecutiveId(salesExecutiveId)
                    .salesExecutiveName((String) responseMap.get("salesExecutiveName"))
                    .salesExecutiveEmail((String) responseMap.get("salesExecutiveEmail"))
                    .dealerId(((Number) responseMap.get("dealerId")).longValue())
                    .dealerName((String) responseMap.get("dealerName"))
                    .message((String) responseMap.get("message"))
                    .build();
            
            log.info("Processed match response for deal {}: {}", dealId, response);
            
            // Assign sales executive to the deal
            dealService.assignSalesExecutive(dealId, salesExecutiveId);
            
        } catch (Exception e) {
            log.error("Error processing sales executive match response", e);
        }
    }
    
    @KafkaListener(topics = "health-score-response", groupId = "crm-group")
    public void consumeHealthScoreResponse(String message) {
        try {
            log.info("Received health score response: {}", message);
            
            // Parse the response
            Map<String, Object> responseMap = objectMapper.readValue(message, Map.class);
            
            HealthScoreResponse response = HealthScoreResponse.builder()
                    .healthScore(((Number) responseMap.get("healthScore")).doubleValue())
                    .criticalThreshold(((Number) responseMap.get("criticalThreshold")).doubleValue())
                    .opportunityThreshold(((Number) responseMap.get("opportunityThreshold")).doubleValue())
                    .recommendation((String) responseMap.get("recommendation"))
                    .build();
            
            String dealId = (String) responseMap.get("dealId");
            
            // Update deal with the new health score
            dealService.updateDealHealth(dealId, response);
            
            log.info("Updated deal {} with health score: {}", dealId, response.getHealthScore());
            
        } catch (Exception e) {
            log.error("Error processing health score response", e);
        }
    }
}
