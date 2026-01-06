package com.teknex.crm.service;

import com.teknex.crm.dto.AuthResponse;
import com.teknex.crm.dto.CustomerRegistrationRequest;
import com.teknex.crm.dto.LoginRequest;
import com.teknex.crm.model.Customer;
import com.teknex.crm.model.Dealer;
import com.teknex.crm.model.SalesExecutive;
import com.teknex.crm.repository.CustomerRepository;
import com.teknex.crm.repository.DealerRepository;
import com.teknex.crm.repository.SalesExecutiveRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class AuthService {
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private SalesExecutiveRepository salesExecutiveRepository;
    
    @Autowired
    private DealerRepository dealerRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    public AuthResponse registerCustomer(CustomerRegistrationRequest request) {
        String userType = request.getUserType() != null ? request.getUserType() : "customer";
        
        log.info("=== Registration Request ===");
        log.info("Name: {}, Email: {}, UserType: {}", request.getName(), request.getEmail(), userType);
        
        if ("sales_executive".equals(userType)) {
            return registerSalesExecutive(request);
        } else {
            return registerAsCustomer(request);
        }
    }
    
    private AuthResponse registerAsCustomer(CustomerRegistrationRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        Customer customer = Customer.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        customer = customerRepository.save(customer);
        log.info("Customer registered with ID: {}", customer.getId());
        
        String token = jwtService.generateToken(customer.getEmail(), customer.getId(), "customer");
        
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(customer.getId())
                .name(customer.getName())
                .email(customer.getEmail())
                .userType("customer")
                .build();
    }
    
    private AuthResponse registerSalesExecutive(CustomerRegistrationRequest request) {
        if (salesExecutiveRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists for sales executive");
        }
        
        // Get dealer - default to dealer ID 1 (Premium Auto Hub) if not specified
        Long dealerId = request.getDealerId() != null ? request.getDealerId() : 1L;
        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new RuntimeException("Dealer not found with ID: " + dealerId));
        
        SalesExecutive salesExecutive = SalesExecutive.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .dealer(dealer)
                .performanceScore(75.0)
                .activeDeals(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        salesExecutive = salesExecutiveRepository.save(salesExecutive);
        log.info("Sales Executive registered with ID: {}, Dealer: {}", salesExecutive.getId(), dealer.getName());
        
        String token = jwtService.generateToken(salesExecutive.getEmail(), salesExecutive.getId(), "sales_executive");
        
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(salesExecutive.getId())
                .name(salesExecutive.getName())
                .email(salesExecutive.getEmail())
                .userType("sales_executive")
                .build();
    }
    
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        String userType = request.getUserType() != null ? request.getUserType() : "customer";
        
        if ("sales_executive".equals(userType)) {
            SalesExecutive salesExecutive = salesExecutiveRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("Sales Executive not found"));
            
            String token = jwtService.generateToken(salesExecutive.getEmail(), salesExecutive.getId(), "sales_executive");
            
            return AuthResponse.builder()
                    .token(token)
                    .type("Bearer")
                    .id(salesExecutive.getId())
                    .name(salesExecutive.getName())
                    .email(salesExecutive.getEmail())
                    .userType("sales_executive")
                    .build();
        } else {
            Customer customer = customerRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            
            String token = jwtService.generateToken(customer.getEmail(), customer.getId(), "customer");
            
            return AuthResponse.builder()
                    .token(token)
                    .type("Bearer")
                    .id(customer.getId())
                    .name(customer.getName())
                    .email(customer.getEmail())
                    .userType("customer")
                    .build();
        }
    }
}
