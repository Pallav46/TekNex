package com.teknex.crm.controller;

import com.teknex.crm.model.DealDNA;
import com.teknex.crm.repository.DealDNARepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deal-dna")
@CrossOrigin(origins = "*")
public class DealDNAController {
    
    @Autowired
    private DealDNARepository dealDNARepository;
    
    @GetMapping("/deal/{dealId}")
    public ResponseEntity<DealDNA> getDealDNAByDealId(@PathVariable String dealId) {
        DealDNA dealDNA = dealDNARepository.findByDealId(dealId)
                .orElseThrow(() -> new RuntimeException("Deal DNA not found"));
        return ResponseEntity.ok(dealDNA);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DealDNA> getDealDNAById(@PathVariable String id) {
        DealDNA dealDNA = dealDNARepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deal DNA not found"));
        return ResponseEntity.ok(dealDNA);
    }
}
