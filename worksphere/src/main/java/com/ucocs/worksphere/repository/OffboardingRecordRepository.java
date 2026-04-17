package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.OffboardingRecord;
import com.ucocs.worksphere.enums.OffboardingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OffboardingRecordRepository extends JpaRepository<OffboardingRecord, UUID> {
    Optional<OffboardingRecord> findByEmployee(Employee employee);

    List<OffboardingRecord> findByStatus(OffboardingStatus status);
    Optional<OffboardingRecord> findByEmployeeId(UUID employeeId);

}
