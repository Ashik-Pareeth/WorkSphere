package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeaveRequest;
import com.ucocs.worksphere.enums.LeaveRequestStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {

        @EntityGraph(attributePaths = {"employee", "leavePolicy", "reviewer"})
        List<LeaveRequest> findByEmployeeOrderByCreatedAtDesc(Employee employee);

        @EntityGraph(attributePaths = {"employee", "leavePolicy", "reviewer"})
        List<LeaveRequest> findByEmployeeDepartmentIdAndStatus(UUID departmentId, LeaveRequestStatus status);

        @EntityGraph(attributePaths = {"employee", "leavePolicy", "reviewer"})
        @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status = :status ORDER BY lr.createdAt DESC")
        List<LeaveRequest> findAllByStatusWithDetails(@Param("status") LeaveRequestStatus status);

        @EntityGraph(attributePaths = {"employee", "leavePolicy", "reviewer"})
        @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.department.id = :deptId AND lr.status = :status ORDER BY lr.createdAt DESC")
        List<LeaveRequest> findByDepartmentAndStatusWithDetails(@Param("deptId") UUID departmentId, @Param("status") LeaveRequestStatus status);

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

        @Override
        @EntityGraph(attributePaths = {"employee", "leavePolicy", "reviewer"})
        Optional<LeaveRequest> findById(UUID id);

        @Override
        @EntityGraph(attributePaths = {"employee", "leavePolicy", "reviewer"})
        List<LeaveRequest> findAll();
}