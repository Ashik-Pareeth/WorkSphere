package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.EmployeeActionRecord;
import com.ucocs.worksphere.enums.EmployeeActionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EmployeeActionRepository extends JpaRepository<EmployeeActionRecord, UUID> {

    /** All actions for a specific employee (most recent first). */
    List<EmployeeActionRecord> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    /** All pending manager reports (for HR review queue). */
    List<EmployeeActionRecord> findByStatusOrderByCreatedAtDesc(EmployeeActionStatus status);

    /** Actions submitted by a specific manager. */
    List<EmployeeActionRecord> findByInitiatedByIdOrderByCreatedAtDesc(UUID initiatedById);
}