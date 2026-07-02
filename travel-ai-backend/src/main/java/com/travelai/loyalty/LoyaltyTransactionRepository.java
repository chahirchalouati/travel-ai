package com.travelai.loyalty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, UUID> {

    List<LoyaltyTransaction> findTop20ByAccountIdOrderByCreatedAtDesc(UUID accountId);
}
