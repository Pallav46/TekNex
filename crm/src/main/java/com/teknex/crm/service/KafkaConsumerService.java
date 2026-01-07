package com.teknex.crm.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teknex.crm.dto.HealthScoreResponse;
import com.teknex.crm.dto.SalesExecutiveMatchResponse;
import com.teknex.crm.model.SalesExecutive;
import com.teknex.crm.repository.SalesExecutiveRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class KafkaConsumerService {
    
    @Autowired
    private DealService dealService;

    @Autowired
    private SalesExecutiveRepository salesExecutiveRepository;
    
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
            Object seObj = responseMap.get("salesExecutiveId");
            if (seObj == null) {
                seObj = responseMap.get("SalesExecutiveID");
            }

            Long salesExecutiveId = resolveSalesExecutiveId(seObj);

            if (dealId == null || dealId.isBlank()) {
                throw new IllegalArgumentException("Missing dealId in match response");
            }

            log.info("Parsed - Deal ID: {}, Sales Executive ID: {}", dealId, salesExecutiveId);
            log.info("Processed match response - Assigning SE {} to deal {}", salesExecutiveId, dealId);
            
            // Assign sales executive to the deal
            dealService.assignSalesExecutive(dealId, salesExecutiveId);
            
            log.info("Successfully assigned sales executive to deal {}", dealId);
            
        } catch (Exception e) {
            log.error("Error processing sales executive match response: {}", e.getMessage(), e);
        }
    }

    private Long resolveSalesExecutiveId(Object seObj) {
        if (seObj == null) {
            throw new IllegalArgumentException("Missing salesExecutiveId in match response");
        }

        if (seObj instanceof Number) {
            return ((Number) seObj).longValue();
        }

        if (!(seObj instanceof String)) {
            throw new IllegalArgumentException("Invalid salesExecutiveId type: " + seObj.getClass().getName());
        }

        String raw = ((String) seObj).trim();
        if (raw.isEmpty()) {
            throw new IllegalArgumentException("Empty salesExecutiveId in match response");
        }

        // If predictor already returns a numeric id as string, use it.
        if (raw.matches("\\d+")) {
            return Long.parseLong(raw);
        }

        // Predictor may return an external code like "SALESP075".
        // Map deterministically to an existing sales executive id.
        String digits = raw.replaceAll("\\D+", "");
        if (digits.isEmpty()) {
            throw new IllegalArgumentException("Non-numeric salesExecutiveId with no digits: " + raw);
        }

        int seed = Integer.parseInt(digits);

        List<Long> ids = salesExecutiveRepository.findAll().stream()
                .map(SalesExecutive::getId)
                .sorted(Comparator.naturalOrder())
                .toList();

        if (ids.isEmpty()) {
            throw new IllegalStateException("No sales executives available to assign");
        }

        int idx = Math.floorMod(seed - 1, ids.size());
        Long mapped = ids.get(idx);
        log.info("Mapped external salesExecutiveId '{}' -> internal id {} (poolSize={})", raw, mapped, ids.size());
        return mapped;
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
