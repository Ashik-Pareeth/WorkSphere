package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeaveBalance;
import com.ucocs.worksphere.entity.LeavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {
    // Finds a specific policy balance for an employee for a specific year
    Optional<LeaveBalance> findByEmployeeAndLeavePolicyAndValidForYear(Employee employee, LeavePolicy leavePolicy, Integer validForYear);

    // Gets all balances (Sick, PTO, etc.) for an employee for the current year
    List<LeaveBalance> findByEmployeeAndValidForYear(Employee employee, Integer validForYear);
}