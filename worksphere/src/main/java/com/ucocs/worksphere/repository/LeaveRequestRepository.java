package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeaveRequest;
import com.ucocs.worksphere.enums.LeaveRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
        @Query("SELECT DISTINCT lr FROM LeaveRequest lr " +
               "LEFT JOIN FETCH lr.employee " +
               "LEFT JOIN FETCH lr.leavePolicy " +
               "LEFT JOIN FETCH lr.reviewer " +
               "WHERE lr.employee = :employee " +
               "ORDER BY lr.createdAt DESC")
        List<LeaveRequest> findByEmployeeOrderByCreatedAtDesc(@Param("employee") Employee employee);

        // For managers to see pending requests for their department
        @Query("SELECT DISTINCT lr FROM LeaveRequest lr " +
               "LEFT JOIN FETCH lr.employee " +
               "LEFT JOIN FETCH lr.leavePolicy " +
               "LEFT JOIN FETCH lr.reviewer " +
               "WHERE lr.employee.department.id = :departmentId AND lr.status = :status")
        List<LeaveRequest> findByEmployeeDepartmentIdAndStatus(@Param("departmentId") UUID departmentId, @Param("status") LeaveRequestStatus status);

        // Fetch all pending requests with employee and policy eagerly loaded (for
        // HR/Admin)
        @Query("SELECT DISTINCT lr FROM LeaveRequest lr " +
                        "LEFT JOIN FETCH lr.employee " +
                        "LEFT JOIN FETCH lr.leavePolicy " +
                        "LEFT JOIN FETCH lr.reviewer " +
                        "WHERE lr.status = :status " +
                        "ORDER BY lr.createdAt DESC")
        List<LeaveRequest> findAllByStatusWithDetails(@Param("status") LeaveRequestStatus status);

        // Fetch pending requests for a specific department with eager loading
        @Query("SELECT DISTINCT lr FROM LeaveRequest lr " +
                        "LEFT JOIN FETCH lr.employee " +
                        "LEFT JOIN FETCH lr.leavePolicy " +
                        "LEFT JOIN FETCH lr.reviewer " +
                        "WHERE lr.employee.department.id = :deptId AND lr.status = :status " +
                        "ORDER BY lr.createdAt DESC")
        List<LeaveRequest> findByDepartmentAndStatusWithDetails(@Param("deptId") UUID departmentId,
                        @Param("status") LeaveRequestStatus status);

        @Query("SELECT COUNT(lr) > 0 FROM LeaveRequest lr " +
                        "WHERE lr.employee.id = :employeeId " +
                        "AND lr.status IN :statuses " +
                        "AND lr.startDate <= :endDate " +
                        "AND lr.endDate >= :startDate")
        boolean existsByEmployee_IdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        @Param("employeeId") UUID employeeId,
                        @Param("statuses") List<LeaveRequestStatus> statuses,
                        @Param("endDate") LocalDate endDate,
                        @Param("startDate") LocalDate startDate);
}