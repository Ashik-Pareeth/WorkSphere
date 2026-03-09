package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.AuditLog;
import com.ucocs.worksphere.enums.AuditAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId);

    List<AuditLog> findByPerformedByOrderByCreatedAtDesc(UUID performedBy);

    List<AuditLog> findByActionOrderByCreatedAtDesc(AuditAction action);
}
