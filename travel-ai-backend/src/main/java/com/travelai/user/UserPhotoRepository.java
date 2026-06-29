package com.travelai.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserPhotoRepository extends JpaRepository<UserPhoto, UUID> {

    List<UserPhoto> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<UserPhoto> findByIdAndUserId(UUID id, UUID userId);

    long countByUserId(UUID userId);
}
