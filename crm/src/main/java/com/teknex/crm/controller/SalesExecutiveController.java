package com.teknex.crm.controller;

import com.teknex.crm.model.SalesExecutive;
import com.teknex.crm.repository.SalesExecutiveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales-executives")
@CrossOrigin(origins = "*")
public class SalesExecutiveController {
    
    @Autowired
    private SalesExecutiveRepository salesExecutiveRepository;
    
    @GetMapping
    public ResponseEntity<List<SalesExecutive>> getAllSalesExecutives() {
        List<SalesExecutive> salesExecutives = salesExecutiveRepository.findAll();
        return ResponseEntity.ok(salesExecutives);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SalesExecutive> getSalesExecutiveById(@PathVariable Long id) {
        SalesExecutive salesExecutive = salesExecutiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales Executive not found"));
        return ResponseEntity.ok(salesExecutive);
    }
    
    @GetMapping("/available")
    public ResponseEntity<List<SalesExecutive>> getAvailableSalesExecutives() {
        List<SalesExecutive> salesExecutives = salesExecutiveRepository.findByAvailableTrue();
        return ResponseEntity.ok(salesExecutives);
    }
    
    @GetMapping("/dealer/{dealerId}")
    public ResponseEntity<List<SalesExecutive>> getSalesExecutivesByDealer(@PathVariable Long dealerId) {
        List<SalesExecutive> salesExecutives = salesExecutiveRepository.findByDealerId(dealerId);
        return ResponseEntity.ok(salesExecutives);
    }
}
