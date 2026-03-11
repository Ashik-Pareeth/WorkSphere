package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.PayrollRecord;
import com.ucocs.worksphere.enums.PayrollStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollRecordRepository extends JpaRepository<PayrollRecord, UUID> {

    Optional<PayrollRecord> findByEmployeeAndMonthAndYear(Employee employee, Integer month, Integer year);

    List<PayrollRecord> findByMonthAndYear(Integer month, Integer year);

    List<PayrollRecord> findByMonthAndYearAndStatus(Integer month, Integer year, PayrollStatus status);

    List<PayrollRecord> findByEmployeeOrderByYearDescMonthDesc(Employee employee);
}
