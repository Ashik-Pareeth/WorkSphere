package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.PerformanceAppraisal;
import com.ucocs.worksphere.enums.AppraisalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PerformanceAppraisalRepository extends JpaRepository<PerformanceAppraisal, UUID> {
    List<PerformanceAppraisal> findByEmployeeOrderByReviewPeriodEndDesc(Employee employee);

    List<PerformanceAppraisal> findByManagerOrderByReviewPeriodEndDesc(Employee manager);

    List<PerformanceAppraisal> findByStatus(AppraisalStatus status);

    Optional<PerformanceAppraisal> findFirstByEmployeeAndStatusAndFinalScoreIsNotNullAndReviewPeriodEndLessThanEqualOrderByReviewPeriodEndDesc(
            Employee employee,
            AppraisalStatus status,
            LocalDate reviewPeriodEnd);
}
