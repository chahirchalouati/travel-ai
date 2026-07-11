package com.travelai.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByEmailVerificationToken(String emailVerificationToken);
    List<User> findByRoleAndActiveTrue(UserRole role);
    List<User> findByActiveTrue();
}
