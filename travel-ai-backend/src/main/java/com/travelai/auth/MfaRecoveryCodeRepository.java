package com.travelai.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MfaRecoveryCodeRepository extends JpaRepository<MfaRecoveryCode, UUID> {

    /** Unused recovery codes for a user, used to match a presented recovery code. */
    List<MfaRecoveryCode> findByUserAndUsedAtIsNull(User user);

    void deleteByUser(User user);
}
