package com.teknex.crm.controller;

import com.teknex.crm.dto.BotChatRequest;
import com.teknex.crm.dto.DealStageUpdateRequest;
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

    // Customer books an appointment for a deal
    @PostMapping("/{dealId}/appointment")
    public ResponseEntity<Deal> bookAppointment(@PathVariable String dealId, @RequestBody DealUpdateRequest request) {
        DealUpdateRequest update = DealUpdateRequest.builder()
                .dealId(dealId)
                .appointmentDate(request.getAppointmentDate())
                .note(request.getNote())
                .build();
        return ResponseEntity.ok(dealService.updateDeal(update));
    }

    // Sales executive advances deal stage
    @PutMapping("/{dealId}/stage")
    public ResponseEntity<Deal> updateStage(@PathVariable String dealId, @RequestBody DealStageUpdateRequest request) {
        DealUpdateRequest update = DealUpdateRequest.builder()
                .dealId(dealId)
                .status(request.getStatus())
                .build();
        return ResponseEntity.ok(dealService.updateDeal(update));
    }

    // Sales executive marks deal completed
    @PostMapping("/{dealId}/complete")
    public ResponseEntity<Deal> completeDeal(@PathVariable String dealId) {
        DealUpdateRequest update = DealUpdateRequest.builder()
                .dealId(dealId)
                .status(Deal.DealStatus.CLOSED.name())
                .note("Deal marked as completed")
                .build();
        return ResponseEntity.ok(dealService.updateDeal(update));
    }

    // Sales executive marks deal failed
    @PostMapping("/{dealId}/fail")
    public ResponseEntity<Deal> failDeal(@PathVariable String dealId) {
        DealUpdateRequest update = DealUpdateRequest.builder()
                .dealId(dealId)
                .status(Deal.DealStatus.LOST.name())
                .note("Deal marked as failed")
                .build();
        return ResponseEntity.ok(dealService.updateDeal(update));
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
