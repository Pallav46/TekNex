package com.teknex.crm.config;

import com.teknex.crm.repository.CustomerRepository;
import com.teknex.crm.repository.SalesExecutiveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private SalesExecutiveRepository salesExecutiveRepository;
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Try to find in customers first
        var customer = customerRepository.findByEmail(email);
        if (customer.isPresent()) {
            return User.builder()
                    .username(customer.get().getEmail())
                    .password(customer.get().getPassword())
                    .authorities(new ArrayList<>())
                    .build();
        }
        
        // Try to find in sales executives
        var salesExecutive = salesExecutiveRepository.findByEmail(email);
        if (salesExecutive.isPresent()) {
            return User.builder()
                    .username(salesExecutive.get().getEmail())
                    .password(salesExecutive.get().getPassword())
                    .authorities(new ArrayList<>())
                    .build();
        }
        
        throw new UsernameNotFoundException("User not found with email: " + email);
    }
}
