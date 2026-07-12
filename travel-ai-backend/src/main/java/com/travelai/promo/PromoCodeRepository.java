package com.travelai.promo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface PromoCodeRepository extends JpaRepository<PromoCode, UUID>, JpaSpecificationExecutor<PromoCode> {

    Optional<PromoCode> findByCodeIgnoreCase(String code);
}
