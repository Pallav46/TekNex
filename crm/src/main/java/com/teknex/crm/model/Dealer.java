package com.teknex.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dealers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dealer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    private String phone;
    
    private String location;
    
    @Column(name = "date_of_joining")
    private LocalDate dateOfJoining;
    
    @Column(name = "deals_closed")
    private Integer dealsClosed = 0;
    
    @Column(name = "deals_pursued")
    private Integer dealsPursued = 0;
    
    @Column(name = "active_deals")
    private Integer activeDeals = 0;
    
    @Column(name = "total_revenue")
    private Double totalRevenue = 0.0;
    
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
