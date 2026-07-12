package com.travelai.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:actor IS NULL OR LOWER(a.actor) LIKE LOWER(CONCAT('%', CAST(:actor AS string), '%')))
              AND (:action IS NULL OR a.action = CAST(:action AS string))
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> search(@Param("actor") String actor,
                          @Param("action") String action,
                          Pageable pageable);
}
