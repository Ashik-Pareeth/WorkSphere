package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeaveBalance;
import com.ucocs.worksphere.entity.LeavePolicy;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {

    @EntityGraph(attributePaths = {"employee", "leavePolicy"})
    Optional<LeaveBalance> findByEmployeeAndLeavePolicyAndValidForYear(Employee employee, LeavePolicy leavePolicy, Integer validForYear);

    @EntityGraph(attributePaths = {"employee", "leavePolicy"})
    List<LeaveBalance> findByEmployeeAndValidForYear(Employee employee, Integer validForYear);

    @EntityGraph(attributePaths = {"employee", "leavePolicy"})
    List<LeaveBalance> findByValidForYear(Integer validForYear);

    @Override
    @EntityGraph(attributePaths = {"employee", "leavePolicy"})
    Optional<LeaveBalance> findById(UUID id);

    @Override
    @EntityGraph(attributePaths = {"employee", "leavePolicy"})
    List<LeaveBalance> findAll();
}