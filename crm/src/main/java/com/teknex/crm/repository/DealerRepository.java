package com.teknex.crm.repository;

import com.teknex.crm.model.Dealer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DealerRepository extends JpaRepository<Dealer, Long> {
    Optional<Dealer> findByEmail(String email);
}
