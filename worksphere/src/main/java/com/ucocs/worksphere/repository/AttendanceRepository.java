package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Attendance;
import com.ucocs.worksphere.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    @Query("SELECT DISTINCT a FROM Attendance a " +
           "LEFT JOIN FETCH a.employee " +
           "WHERE a.employee = :employee AND a.date = :date")
    Optional<Attendance> findByEmployeeAndDate(@Param("employee") Employee employee, @Param("date") LocalDate date);

    @Query("SELECT DISTINCT a FROM Attendance a " +
           "LEFT JOIN FETCH a.employee " +
           "WHERE a.employee = :employee")
    List<Attendance> findByEmployee(@Param("employee") Employee employee);

    @Query("SELECT DISTINCT a FROM Attendance a " +
           "LEFT JOIN FETCH a.employee " +
           "WHERE a.date = :date")
    List<Attendance> findByDate(@Param("date") LocalDate date);

    @Query("SELECT DISTINCT a FROM Attendance a " +
           "LEFT JOIN FETCH a.employee " +
           "WHERE a.date = :date AND a.employee.department.id = :departmentId")
    List<Attendance> findByDateAndEmployee_Department_Id(@Param("date") LocalDate date, @Param("departmentId") UUID departmentId);
}
