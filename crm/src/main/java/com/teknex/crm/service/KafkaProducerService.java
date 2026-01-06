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
        log.info("Sending sales executive match request to Kafka: {}", request);
        kafkaTemplate.send("sales-executive-match-request", request);
    }
    
    public void sendHealthScoreRequest(HealthScoreRequest request) {
        log.info("Sending health score request to Kafka: {}", request);
        kafkaTemplate.send("health-score-request", request);
    }
}
