package com.teknex.crm.service;

import com.teknex.crm.dto.*;
import com.teknex.crm.model.*;
import com.teknex.crm.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class DealService {
    
    @Autowired
    private DealRepository dealRepository;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private SalesExecutiveRepository salesExecutiveRepository;
    
    @Autowired
    private DealerRepository dealerRepository;
    
    @Autowired
    private DealDNARepository dealDNARepository;
    
    @Autowired
    private ChatRepository chatRepository;
    
    @Autowired
    private KafkaProducerService kafkaProducerService;
    
    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    
    public Deal initiateDeal(BotChatRequest request) {
        log.info("=== Initiating new deal ===");
        log.info("Customer ID: {}", request.getCustomerId());
        log.info("Interest: {}, Budget: {}, Timeframe: {}", 
                request.getInterestCategory(), request.getBudgetRange(), request.getIntendedTimeframe());
        
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        log.info("Found customer: {} ({})", customer.getName(), customer.getEmail());
        
        // Create initial deal
        Deal deal = Deal.builder()
                .customerId(customer.getId())
                .customerName(customer.getName())
                .customerEmail(customer.getEmail())
                .interestCategory(request.getInterestCategory())
                .budgetRange(request.getBudgetRange())
                .intendedTimeframe(request.getIntendedTimeframe())
                .preferredContactMode(request.getPreferredContactMode())
                .status(Deal.DealStatus.INITIATED)
                .healthScore(50.0)
                .criticalThreshold(30.0)
                .opportunityThreshold(70.0)
                .notes(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        deal = dealRepository.save(deal);
        log.info("Deal created with ID: {}", deal.getId());
        
        // Create initial bot chat
        Chat chat = Chat.builder()
                .dealId(deal.getId())
                .customerId(customer.getId())
                .chatType(Chat.ChatType.BOT)
                .messages(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        chatRepository.save(chat);
        log.info("Bot chat created for deal: {}", deal.getId());
        
        // Send request to ML service to match sales executive
        log.info("Building Kafka match request for deal: {}", deal.getId());
        SalesExecutiveMatchRequest matchRequest = SalesExecutiveMatchRequest.builder()
                .dealId(deal.getId())
                .customerId(customer.getId())
                .customerName(customer.getName())
                .customerEmail(customer.getEmail())
                .interestCategory(request.getInterestCategory())
                .budgetRange(request.getBudgetRange())
                .intendedTimeframe(request.getIntendedTimeframe())
                .preferredContactMode(request.getPreferredContactMode())
                .build();
        
        log.info("Sending Kafka match request...");
        kafkaProducerService.sendSalesExecutiveMatchRequest(matchRequest);
        
        log.info("Deal initiated successfully: {}", deal.getId());
        return deal;
    }
    
    public Deal assignSalesExecutive(String dealId, Long salesExecutiveId) {
        log.info("=== Assigning sales executive {} to deal {} ===", salesExecutiveId, dealId);
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Deal not found"));
        
        SalesExecutive salesExecutive = salesExecutiveRepository.findById(salesExecutiveId)
                .orElseThrow(() -> new RuntimeException("Sales Executive not found"));
        
        deal.setSalesExecutiveId(salesExecutive.getId());
        deal.setSalesExecutiveName(salesExecutive.getName());
        deal.setDealerId(salesExecutive.getDealer().getId());
        deal.setDealerName(salesExecutive.getDealer().getName());
        deal.setStatus(Deal.DealStatus.IN_PROGRESS);
        deal.setUpdatedAt(LocalDateTime.now());
        
        deal = dealRepository.save(deal);
        
        // Create sales executive chat
        Chat chat = Chat.builder()
                .dealId(deal.getId())
                .customerId(deal.getCustomerId())
                .salesExecutiveId(salesExecutive.getId())
                .chatType(Chat.ChatType.SALES_EXECUTIVE)
                .messages(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        chatRepository.save(chat);
        
        // Create Deal DNA
        createDealDNA(deal, salesExecutive);
        
        // Update sales executive stats
        salesExecutive.setActiveDeals(salesExecutive.getActiveDeals() + 1);
        salesExecutiveRepository.save(salesExecutive);
        
        // Send WebSocket notification to customer
        log.info("Sending WebSocket notification to customer for deal: {}", dealId);
        messagingTemplate.convertAndSend("/topic/deal/" + dealId + "/assignment", deal);
        
        // Send WebSocket notification to sales executive about new customer
        log.info("Sending WebSocket notification to sales executive {} for new customer", salesExecutiveId);
        messagingTemplate.convertAndSend("/topic/sales-executive/" + salesExecutiveId + "/new-customer", deal);
        
        log.info("Sales executive assigned to deal: {}", dealId);
        return deal;
    }
    
    private void createDealDNA(Deal deal, SalesExecutive salesExecutive) {
        DealDNA dna = DealDNA.builder()
                .dealId(deal.getId())
                .customerId(deal.getCustomerId())
                .customerName(deal.getCustomerName())
                .customerEmail(deal.getCustomerEmail())
                .salesExecutiveId(salesExecutive.getId())
                .salesExecutiveName(salesExecutive.getName())
                .salesExecutivePerformanceScore(salesExecutive.getPerformanceScore())
                .dealerId(salesExecutive.getDealer().getId())
                .dealerName(salesExecutive.getDealer().getName())
                .dealerLocation(salesExecutive.getDealer().getLocation())
                .interestCategory(deal.getInterestCategory())
                .budgetRange(deal.getBudgetRange())
                .intendedTimeframe(deal.getIntendedTimeframe())
                .preferredContactMode(deal.getPreferredContactMode())
                .healthScore(deal.getHealthScore())
                .criticalThreshold(deal.getCriticalThreshold())
                .opportunityThreshold(deal.getOpportunityThreshold())
                .totalInteractions(0)
                .customerResponses(0)
                .salesExecutiveFollowUps(0)
                .averageResponseTime(0.0)
                .testDriveRequested(false)
                .priceNegotiated(false)
                .financeDiscussed(false)
                .appointmentScheduled(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        dealDNARepository.save(dna);
    }
    
    public Deal updateDeal(DealUpdateRequest request) {
        Deal deal = dealRepository.findById(request.getDealId())
                .orElseThrow(() -> new RuntimeException("Deal not found"));
        
        if (request.getStatus() != null) {
            deal.setStatus(Deal.DealStatus.valueOf(request.getStatus()));
        }
        
        if (request.getHealthScore() != null) {
            deal.setHealthScore(request.getHealthScore());
        }
        
        if (request.getTestDriveOffered() != null) {
            deal.setTestDriveOffered(request.getTestDriveOffered());
        }
        
        if (request.getHomeTestDriveOffered() != null) {
            deal.setHomeTestDriveOffered(request.getHomeTestDriveOffered());
        }
        
        if (request.getAppointmentDate() != null) {
            deal.setAppointmentDate(request.getAppointmentDate());
            deal.setStatus(Deal.DealStatus.APPOINTMENT_SCHEDULED);
        }
        
        if (request.getNote() != null) {
            if (deal.getNotes() == null) {
                deal.setNotes(new ArrayList<>());
            }
            deal.getNotes().add(request.getNote());
        }
        
        deal.setUpdatedAt(LocalDateTime.now());
        deal.setLastContactedAt(LocalDateTime.now());
        
        deal = dealRepository.save(deal);
        
        // Update Deal DNA
        updateDealDNA(deal);
        
        log.info("Deal updated: {}", deal.getId());
        return deal;
    }
    
    private void updateDealDNA(Deal deal) {
        dealDNARepository.findByDealId(deal.getId()).ifPresent(dna -> {
            dna.setHealthScore(deal.getHealthScore());
            dna.setCriticalThreshold(deal.getCriticalThreshold());
            dna.setOpportunityThreshold(deal.getOpportunityThreshold());
            dna.setTestDriveRequested(deal.getTestDriveOffered());
            dna.setAppointmentScheduled(deal.getAppointmentDate() != null);
            dna.setUpdatedAt(LocalDateTime.now());
            dealDNARepository.save(dna);
        });
    }
    
    public void updateDealHealth(String dealId, HealthScoreResponse response) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Deal not found"));
        
        deal.setHealthScore(response.getHealthScore());
        deal.setCriticalThreshold(response.getCriticalThreshold());
        deal.setOpportunityThreshold(response.getOpportunityThreshold());
        deal.setUpdatedAt(LocalDateTime.now());
        
        // Check thresholds and take actions
        if (response.getHealthScore() >= response.getOpportunityThreshold()) {
            deal.setHomeTestDriveOffered(true);
            deal.getNotes().add("High opportunity score - Home test drive offered");
        } else if (response.getHealthScore() <= response.getCriticalThreshold()) {
            deal.getNotes().add("Low health score - Deal at risk");
        }
        
        dealRepository.save(deal);
        updateDealDNA(deal);
    }
    
    public List<Deal> getDealsByCustomer(Long customerId) {
        return dealRepository.findByCustomerId(customerId);
    }
    
    public List<Deal> getDealsBySalesExecutive(Long salesExecutiveId) {
        return dealRepository.findBySalesExecutiveId(salesExecutiveId);
    }
    
    public Deal getDealById(String dealId) {
        return dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Deal not found"));
    }
    
    public void requestHealthScore(String dealId) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Deal not found"));
        
        dealDNARepository.findByDealId(dealId).ifPresent(dna -> {
            HealthScoreRequest request = HealthScoreRequest.builder()
                    .dealId(dealId)
                    .dealDnaId(dna.getId())
                    .build();
            
            kafkaProducerService.sendHealthScoreRequest(request);
            log.info("Health score request sent for deal: {}", dealId);
        });
    }
}
