package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.TimesheetAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TimesheetAuditLogRepository extends JpaRepository<TimesheetAuditLog, UUID> {
    // Allows us to pull the entire edit history for a specific timesheet
    List<TimesheetAuditLog> findByAttendanceIdOrderByChangeTimestampDesc(UUID attendanceId);
}