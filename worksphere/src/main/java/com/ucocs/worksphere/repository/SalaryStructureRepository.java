package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.JobPosition;
import com.ucocs.worksphere.entity.SalaryStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, UUID> {

    @Query("SELECT DISTINCT ss FROM SalaryStructure ss " +
           "LEFT JOIN FETCH ss.employee " +
           "LEFT JOIN FETCH ss.jobPosition " +
           "WHERE ss.employee = :employee")
    Optional<SalaryStructure> findByEmployee(@Param("employee") Employee employee);

    @Query("SELECT DISTINCT ss FROM SalaryStructure ss " +
           "LEFT JOIN FETCH ss.employee " +
           "LEFT JOIN FETCH ss.jobPosition " +
           "WHERE ss.jobPosition = :jobPosition")
    List<SalaryStructure> findByJobPosition(@Param("jobPosition") JobPosition jobPosition);

    @Query("SELECT DISTINCT ss FROM SalaryStructure ss " +
           "LEFT JOIN FETCH ss.employee " +
           "LEFT JOIN FETCH ss.jobPosition " +
           "WHERE ss.employee = :employee AND ss.effectiveDate <= :date " +
           "ORDER BY ss.effectiveDate DESC")
    Optional<SalaryStructure> findFirstByEmployeeAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
            @Param("employee") Employee employee, @Param("date") LocalDate date);

    @Query("SELECT DISTINCT ss FROM SalaryStructure ss " +
           "LEFT JOIN FETCH ss.employee " +
           "LEFT JOIN FETCH ss.jobPosition " +
           "WHERE ss.jobPosition = :jobPosition AND ss.effectiveDate <= :date " +
           "ORDER BY ss.effectiveDate DESC")
    Optional<SalaryStructure> findFirstByJobPositionAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
            @Param("jobPosition") JobPosition jobPosition, @Param("date") LocalDate date);
}
