package com.teknex.crm.repository;

import com.teknex.crm.model.SalesExecutive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesExecutiveRepository extends JpaRepository<SalesExecutive, Long> {
    Optional<SalesExecutive> findByEmail(String email);
    boolean existsByEmail(String email);
    List<SalesExecutive> findByAvailableTrue();
    List<SalesExecutive> findByDealerId(Long dealerId);
    
    @Query("SELECT se FROM SalesExecutive se WHERE se.available = true AND se.dealer.id = ?1")
    List<SalesExecutive> findAvailableByDealerId(Long dealerId);
}
