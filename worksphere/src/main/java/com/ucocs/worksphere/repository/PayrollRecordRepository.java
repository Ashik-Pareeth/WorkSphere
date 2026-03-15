package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.PayrollRecord;
import com.ucocs.worksphere.enums.PayrollStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollRecordRepository extends JpaRepository<PayrollRecord, UUID> {

    @Query("SELECT DISTINCT pr FROM PayrollRecord pr " +
           "LEFT JOIN FETCH pr.employee " +
           "WHERE pr.employee = :employee AND pr.month = :month AND pr.year = :year")
    Optional<PayrollRecord> findByEmployeeAndMonthAndYear(@Param("employee") Employee employee, @Param("month") Integer month, @Param("year") Integer year);

    @Query("SELECT DISTINCT pr FROM PayrollRecord pr " +
           "LEFT JOIN FETCH pr.employee " +
           "WHERE pr.month = :month AND pr.year = :year")
    List<PayrollRecord> findByMonthAndYear(@Param("month") Integer month, @Param("year") Integer year);

    @Query("SELECT DISTINCT pr FROM PayrollRecord pr " +
           "LEFT JOIN FETCH pr.employee " +
           "WHERE pr.month = :month AND pr.year = :year AND pr.status = :status")
    List<PayrollRecord> findByMonthAndYearAndStatus(@Param("month") Integer month, @Param("year") Integer year, @Param("status") PayrollStatus status);

    @Query("SELECT DISTINCT pr FROM PayrollRecord pr " +
           "LEFT JOIN FETCH pr.employee " +
           "WHERE pr.employee = :employee " +
           "ORDER BY pr.year DESC, pr.month DESC")
    List<PayrollRecord> findByEmployeeOrderByYearDescMonthDesc(@Param("employee") Employee employee);
}
