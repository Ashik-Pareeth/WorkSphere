package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Attendance;
import com.ucocs.worksphere.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Attendance findByEmployeeAndDate(Employee employee, LocalDate date);
}
