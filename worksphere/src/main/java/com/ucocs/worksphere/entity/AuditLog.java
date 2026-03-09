package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.AuditAction;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Immutable, append-only audit log. Never update or delete records.
 * All sensitive HR operations must write an entry before returning.
 */
@Setter
@Getter
@Entity
@Table(name = "audit_logs")
public class AuditLog extends BaseEntity {

    @Column(nullable = false)
    private String entityType;

    @Column(nullable = false)
    private UUID entityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    @Column(nullable = false)
    private UUID performedBy;

    private String ipAddress;

    @Column(columnDefinition = "TEXT")
    private String previousValue;

    @Column(columnDefinition = "TEXT")
    private String newValue;

    private String remarks;
}
