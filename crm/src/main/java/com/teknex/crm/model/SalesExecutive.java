package com.teknex.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_executives")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesExecutive {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    private String phone;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id")
    private Dealer dealer;
    
    @Column(name = "date_of_joining")
    private LocalDate dateOfJoining;
    
    @Column(name = "deals_closed")
    private Integer dealsClosed = 0;
    
    @Column(name = "deals_pursued")
    private Integer dealsPursued = 0;
    
    @Column(name = "active_deals")
    private Integer activeDeals = 0;
    
    @Column(name = "performance_score")
    private Double performanceScore = 0.0;
    
    private Boolean available = true;
    
    private String expertise; // e.g., "SUV,Sedan,Electric"
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
