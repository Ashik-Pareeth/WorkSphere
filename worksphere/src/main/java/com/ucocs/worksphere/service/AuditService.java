package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.AuditLog;
import com.ucocs.worksphere.enums.AuditAction;
import com.ucocs.worksphere.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Audit logging service. Uses REQUIRES_NEW propagation to ensure
 * audit entries persist even when the calling transaction rolls back.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String entityType, UUID entityId, AuditAction action,
            UUID performedBy, String previousValue, String newValue) {
        log(entityType, entityId, action, performedBy, null, previousValue, newValue, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String entityType, UUID entityId, AuditAction action,
            UUID performedBy, String ipAddress, String previousValue,
            String newValue, String remarks) {
        AuditLog entry = new AuditLog();
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setAction(action);
        entry.setPerformedBy(performedBy);
        entry.setIpAddress(ipAddress);
        entry.setPreviousValue(previousValue);
        entry.setNewValue(newValue);
        entry.setRemarks(remarks);

        auditLogRepository.save(entry);
        log.debug("Audit: {} {} on {}:{} by {}", action, entityType, entityType, entityId, performedBy);
    }
}
