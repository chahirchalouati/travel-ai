package com.travelai.stories;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TravelStoryRepository extends JpaRepository<TravelStory, UUID> {

    List<TravelStory> findByActiveTrueOrderBySortOrderAsc();
}
