package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeaveRequest;
import com.ucocs.worksphere.enums.LeaveRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    List<LeaveRequest> findByEmployeeOrderByCreatedAtDesc(Employee employee);

    // For managers to see pending requests for their department
    List<LeaveRequest> findByEmployeeDepartmentIdAndStatus(UUID departmentId, LeaveRequestStatus status);
}