package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeaveTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveTransactionRepository extends JpaRepository<LeaveTransaction, UUID> {
    // The Audit Trail: Fetches the chronological history of how a balance was achieved
    List<LeaveTransaction> findByEmployeeOrderByCreatedAtDesc(Employee employee);
}