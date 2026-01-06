package com.teknex.crm.controller;

import com.teknex.crm.dto.BotChatRequest;
import com.teknex.crm.dto.DealUpdateRequest;
import com.teknex.crm.model.Deal;
import com.teknex.crm.service.DealService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deals")
@CrossOrigin(origins = "*")
public class DealController {
    
    @Autowired
    private DealService dealService;
    
    @PostMapping("/initiate")
    public ResponseEntity<Deal> initiateDeal(@Valid @RequestBody BotChatRequest request) {
        Deal deal = dealService.initiateDeal(request);
        return ResponseEntity.ok(deal);
    }
    
    @PostMapping("/assign")
    public ResponseEntity<Deal> assignSalesExecutive(@RequestParam String dealId, @RequestParam Long salesExecutiveId) {
        Deal deal = dealService.assignSalesExecutive(dealId, salesExecutiveId);
        return ResponseEntity.ok(deal);
    }
    
    @PutMapping("/update")
    public ResponseEntity<Deal> updateDeal(@RequestBody DealUpdateRequest request) {
        Deal deal = dealService.updateDeal(request);
        return ResponseEntity.ok(deal);
    }
    
    @GetMapping("/{dealId}")
    public ResponseEntity<Deal> getDealById(@PathVariable String dealId) {
        Deal deal = dealService.getDealById(dealId);
        return ResponseEntity.ok(deal);
    }
    
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Deal>> getDealsByCustomer(@PathVariable Long customerId) {
        List<Deal> deals = dealService.getDealsByCustomer(customerId);
        return ResponseEntity.ok(deals);
    }
    
    @GetMapping("/sales-executive/{salesExecutiveId}")
    public ResponseEntity<List<Deal>> getDealsBySalesExecutive(@PathVariable Long salesExecutiveId) {
        List<Deal> deals = dealService.getDealsBySalesExecutive(salesExecutiveId);
        return ResponseEntity.ok(deals);
    }
    
    @PostMapping("/{dealId}/request-health-score")
    public ResponseEntity<String> requestHealthScore(@PathVariable String dealId) {
        dealService.requestHealthScore(dealId);
        return ResponseEntity.ok("Health score calculation requested");
    }
}
