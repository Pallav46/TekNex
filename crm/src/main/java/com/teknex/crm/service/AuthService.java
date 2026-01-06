package com.teknex.crm.service;

import com.teknex.crm.dto.AuthResponse;
import com.teknex.crm.dto.CustomerRegistrationRequest;
import com.teknex.crm.dto.LoginRequest;
import com.teknex.crm.model.Customer;
import com.teknex.crm.model.SalesExecutive;
import com.teknex.crm.repository.CustomerRepository;
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
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    public AuthResponse registerCustomer(CustomerRegistrationRequest request) {
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
