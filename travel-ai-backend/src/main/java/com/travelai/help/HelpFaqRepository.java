package com.travelai.help;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HelpFaqRepository extends JpaRepository<HelpFaq, UUID> {

    List<HelpFaq> findByActiveTrueOrderBySortOrderAsc();
}
