package com.travelai.stories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface TravelStoryRepository extends JpaRepository<TravelStory, UUID>, JpaSpecificationExecutor<TravelStory> {

    List<TravelStory> findByActiveTrueOrderBySortOrderAsc();
}
