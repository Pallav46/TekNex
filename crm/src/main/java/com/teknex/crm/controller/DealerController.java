package com.teknex.crm.controller;

import com.teknex.crm.model.Dealer;
import com.teknex.crm.repository.DealerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dealers")
@CrossOrigin(origins = "*")
public class DealerController {
    
    @Autowired
    private DealerRepository dealerRepository;
    
    @GetMapping
    public ResponseEntity<List<Dealer>> getAllDealers() {
        List<Dealer> dealers = dealerRepository.findAll();
        return ResponseEntity.ok(dealers);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Dealer> getDealerById(@PathVariable Long id) {
        Dealer dealer = dealerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dealer not found"));
        return ResponseEntity.ok(dealer);
    }
}
