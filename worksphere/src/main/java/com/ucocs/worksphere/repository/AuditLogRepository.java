package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.AuditLog;
import com.ucocs.worksphere.enums.AuditAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT DISTINCT al FROM AuditLog al " +
           "WHERE al.entityType = :entityType AND al.entityId = :entityId " +
           "ORDER BY al.createdAt DESC")
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(@Param("entityType") String entityType, @Param("entityId") UUID entityId);

    @Query("SELECT DISTINCT al FROM AuditLog al " +
           "WHERE al.performedBy = :performedBy " +
           "ORDER BY al.createdAt DESC")
    List<AuditLog> findByPerformedByOrderByCreatedAtDesc(@Param("performedBy") UUID performedBy);

    @Query("SELECT DISTINCT al FROM AuditLog al " +
           "WHERE al.action = :action " +
           "ORDER BY al.createdAt DESC")
    List<AuditLog> findByActionOrderByCreatedAtDesc(@Param("action") AuditAction action);
}
