package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeaveTransaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveTransactionRepository extends JpaRepository<LeaveTransaction, UUID> {

    @EntityGraph(attributePaths = {"employee", "leavePolicy"})
    List<LeaveTransaction> findByEmployeeOrderByCreatedAtDesc(Employee employee);

    @Override
    @EntityGraph(attributePaths = {"employee", "leavePolicy"})
    Optional<LeaveTransaction> findById(UUID id);

    @Override
    @EntityGraph(attributePaths = {"employee", "leavePolicy"})
    List<LeaveTransaction> findAll();
}