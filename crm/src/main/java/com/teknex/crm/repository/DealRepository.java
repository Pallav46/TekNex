package com.teknex.crm.repository;

import com.teknex.crm.model.Deal;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealRepository extends MongoRepository<Deal, String> {
    List<Deal> findByCustomerId(Long customerId);
    List<Deal> findBySalesExecutiveId(Long salesExecutiveId);
    List<Deal> findByDealerId(Long dealerId);
    List<Deal> findByStatus(Deal.DealStatus status);
    List<Deal> findBySalesExecutiveIdAndStatus(Long salesExecutiveId, Deal.DealStatus status);
}
