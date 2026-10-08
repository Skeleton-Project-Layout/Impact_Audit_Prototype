package org.abhisaran.auditlog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByObjectTypeAndObjectId(String objectType, String objectId, Pageable pageable);

    Page<AuditLog> findByActorId(UUID actorId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:actorRole IS NULL OR a.actorRole = :actorRole) AND " +
           "(:objectType IS NULL OR a.objectType = :objectType) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> searchAuditLogs(
            @org.springframework.data.repository.query.Param("action") String action,
            @org.springframework.data.repository.query.Param("actorRole") String actorRole,
            @org.springframework.data.repository.query.Param("objectType") String objectType,
            Pageable pageable
    );
}
