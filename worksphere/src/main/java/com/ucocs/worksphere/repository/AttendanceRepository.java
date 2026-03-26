package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Attendance;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.DailyStatus;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    Attendance findByEmployeeAndDate(Employee employee, LocalDate date);

    List<Attendance> findByEmployee(Employee employee);

    List<Attendance> findByDate(LocalDate date);

    List<Attendance> findByDateAndEmployee_Department_Id(LocalDate date, UUID departmentId);

    // AttendanceRepository.java
    @Query("SELECT a FROM Attendance a WHERE a.employee = :employee AND a.clockOut IS NULL ORDER BY a.clockIn DESC")
    List<Attendance> findOpenSessionsForEmployee(@Param("employee") Employee employee);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.employee.id = :employeeId AND a.date BETWEEN :startDate AND :endDate AND a.dailyStatus = :status")
    Integer countByStatusInPeriod(@Param("employeeId") UUID employeeId,
                                  @Param("startDate") java.time.LocalDate startDate,
                                  @Param("endDate") java.time.LocalDate endDate,
                                  @Param("status") com.ucocs.worksphere.enums.DailyStatus status);
}
