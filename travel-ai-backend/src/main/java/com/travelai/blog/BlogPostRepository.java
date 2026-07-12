package com.travelai.blog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {

    List<BlogPost> findByActiveTrueOrderBySortOrderAsc();
}
