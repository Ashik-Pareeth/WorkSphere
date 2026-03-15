package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.TimesheetAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TimesheetAuditLogRepository extends JpaRepository<TimesheetAuditLog, UUID> {
    // Allows us to pull the entire edit history for a specific timesheet
    @Query("SELECT DISTINCT tal FROM TimesheetAuditLog tal " +
           "LEFT JOIN FETCH tal.attendance " +
           "LEFT JOIN FETCH tal.changedBy " +
           "WHERE tal.attendance.id = :attendanceId " +
           "ORDER BY tal.changeTimestamp DESC")
    List<TimesheetAuditLog> findByAttendanceIdOrderByChangeTimestampDesc(@Param("attendanceId") UUID attendanceId);
}