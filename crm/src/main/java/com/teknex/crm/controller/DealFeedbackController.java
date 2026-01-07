package com.teknex.crm.controller;

import com.teknex.crm.dto.DealFeedbackRequest;
import com.teknex.crm.model.Deal;
import com.teknex.crm.model.DealFeedback;
import com.teknex.crm.repository.DealFeedbackRepository;
import com.teknex.crm.repository.DealRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/deals")
@CrossOrigin(origins = "*")
public class DealFeedbackController {

    @Autowired
    private DealRepository dealRepository;

    @Autowired
    private DealFeedbackRepository dealFeedbackRepository;

    @PostMapping("/{dealId}/feedback")
    public ResponseEntity<DealFeedback> submitFeedback(
            @PathVariable String dealId,
            @RequestBody DealFeedbackRequest request
    ) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Deal not found"));

        String userType = request.getUserType() == null ? "" : request.getUserType().trim().toLowerCase();
        if (!(userType.equals("customer") || userType.equals("sales_executive"))) {
            throw new IllegalArgumentException("userType must be 'customer' or 'sales_executive'");
        }

        Integer rating = request.getRating();
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("rating must be between 1 and 5");
        }

        DealFeedback feedback = DealFeedback.builder()
                .dealId(dealId)
                .customerId(deal.getCustomerId())
                .salesExecutiveId(deal.getSalesExecutiveId())
                .userType(userType)
                .rating(rating)
                .comment(request.getComment())
                .createdAt(LocalDateTime.now())
                .build();

        DealFeedback saved = dealFeedbackRepository.save(feedback);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{dealId}/feedback")
    public ResponseEntity<List<DealFeedback>> getFeedback(@PathVariable String dealId) {
        return ResponseEntity.ok(dealFeedbackRepository.findByDealId(dealId));
    }
}
