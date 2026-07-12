package com.travelai.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserPlaceRepository extends JpaRepository<UserPlace, UUID> {

    List<UserPlace> findByUserIdOrderByVisitedOnDesc(UUID userId);

    Optional<UserPlace> findByIdAndUserId(UUID id, UUID userId);

    long countByUserId(UUID userId);
}
