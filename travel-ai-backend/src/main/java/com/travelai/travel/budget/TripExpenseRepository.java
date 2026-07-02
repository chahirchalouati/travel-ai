package com.travelai.travel.budget;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripExpenseRepository extends JpaRepository<TripExpense, UUID> {

    List<TripExpense> findByTripIdOrderByCreatedAtDesc(UUID tripId);

    Optional<TripExpense> findByIdAndTripId(UUID id, UUID tripId);
}
