package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.JobPosition;
import com.ucocs.worksphere.entity.SalaryStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, UUID> {

    Optional<SalaryStructure> findByEmployee(Employee employee);

    List<SalaryStructure> findByJobPosition(JobPosition jobPosition);

    Optional<SalaryStructure> findFirstByEmployeeAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
            Employee employee, LocalDate date);

    Optional<SalaryStructure> findFirstByJobPositionAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
            JobPosition jobPosition, LocalDate date);

    void deleteByJobPositionId(UUID id);
}
