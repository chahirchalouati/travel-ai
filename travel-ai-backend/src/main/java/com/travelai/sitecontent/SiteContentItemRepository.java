package com.travelai.sitecontent;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SiteContentItemRepository extends JpaRepository<SiteContentItem, UUID> {

    List<SiteContentItem> findByPageAndActiveTrueOrderBySectionAscSortOrderAsc(String page);
}
