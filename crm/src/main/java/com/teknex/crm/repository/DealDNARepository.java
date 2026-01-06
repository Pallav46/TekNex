package com.teknex.crm.repository;

import com.teknex.crm.model.DealDNA;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DealDNARepository extends MongoRepository<DealDNA, String> {
    Optional<DealDNA> findByDealId(String dealId);
}
