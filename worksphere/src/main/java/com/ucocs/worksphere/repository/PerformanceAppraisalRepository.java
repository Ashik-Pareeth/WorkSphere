package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.PerformanceAppraisal;
import com.ucocs.worksphere.enums.AppraisalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PerformanceAppraisalRepository extends JpaRepository<PerformanceAppraisal, UUID> {
    @Query("SELECT DISTINCT p FROM PerformanceAppraisal p " +
           "LEFT JOIN FETCH p.employee " +
           "LEFT JOIN FETCH p.manager " +
           "WHERE p.employee = :employee " +
           "ORDER BY p.reviewPeriodEnd DESC")
    List<PerformanceAppraisal> findByEmployeeOrderByReviewPeriodEndDesc(@Param("employee") Employee employee);

    @Query("SELECT DISTINCT p FROM PerformanceAppraisal p " +
           "LEFT JOIN FETCH p.employee " +
           "LEFT JOIN FETCH p.manager " +
           "WHERE p.manager = :manager " +
           "ORDER BY p.reviewPeriodEnd DESC")
    List<PerformanceAppraisal> findByManagerOrderByReviewPeriodEndDesc(@Param("manager") Employee manager);

    @Query("SELECT DISTINCT p FROM PerformanceAppraisal p " +
           "LEFT JOIN FETCH p.employee " +
           "LEFT JOIN FETCH p.manager " +
           "WHERE p.status = :status")
    List<PerformanceAppraisal> findByStatus(@Param("status") AppraisalStatus status);
}
