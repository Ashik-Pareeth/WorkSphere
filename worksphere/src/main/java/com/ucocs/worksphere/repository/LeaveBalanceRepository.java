package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeaveBalance;
import com.ucocs.worksphere.entity.LeavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {
    // Finds a specific policy balance for an employee for a specific year
    @Query("SELECT DISTINCT lb FROM LeaveBalance lb " +
           "LEFT JOIN FETCH lb.employee " +
           "LEFT JOIN FETCH lb.leavePolicy " +
           "WHERE lb.employee = :employee AND lb.leavePolicy = :leavePolicy AND lb.validForYear = :validForYear")
    Optional<LeaveBalance> findByEmployeeAndLeavePolicyAndValidForYear(
            @Param("employee") Employee employee, 
            @Param("leavePolicy") LeavePolicy leavePolicy,
            @Param("validForYear") Integer validForYear);

    // Gets all balances (Sick, PTO, etc.) for an employee for the current year
    @Query("SELECT DISTINCT lb FROM LeaveBalance lb " +
           "LEFT JOIN FETCH lb.employee " +
           "LEFT JOIN FETCH lb.leavePolicy " +
           "WHERE lb.employee = :employee AND lb.validForYear = :validForYear")
    List<LeaveBalance> findByEmployeeAndValidForYear(
            @Param("employee") Employee employee, 
            @Param("validForYear") Integer validForYear);

    // Gets all balances across all employees for a specific year (for rollover)
    @Query("SELECT DISTINCT lb FROM LeaveBalance lb " +
           "LEFT JOIN FETCH lb.employee " +
           "LEFT JOIN FETCH lb.leavePolicy " +
           "WHERE lb.validForYear = :validForYear")
    List<LeaveBalance> findByValidForYear(@Param("validForYear") Integer validForYear);
}