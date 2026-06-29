package com.travelai.attraction;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface AttractionRepository
        extends JpaRepository<Attraction, UUID>, JpaSpecificationExecutor<Attraction> {

    List<Attraction> findByActiveTrue(Pageable pageable);

    List<Attraction> findByActiveTrueAndCityIgnoreCase(String city);

    List<Attraction> findByActiveTrueAndCategoryIgnoreCase(String category);

    List<Attraction> findByActiveTrueAndCityIgnoreCaseAndCategoryIgnoreCase(String city, String category);

    List<Attraction> findByActiveTrueAndFeaturedTrueOrderByPopularityScoreDesc();

    List<Attraction> findByActiveTrueOrderByPopularityScoreDesc(Pageable pageable);

    /** Distinct categories that currently have at least one active attraction. */
    @Query("select distinct a.category from Attraction a where a.active = true order by a.category")
    List<String> findDistinctCategories();
}
