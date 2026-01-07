package com.teknex.crm.repository;

import com.teknex.crm.model.DealFeedback;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DealFeedbackRepository extends MongoRepository<DealFeedback, String> {
    List<DealFeedback> findByDealId(String dealId);
}
