package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Attendance;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.repository.AttendanceRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {
    public final AttendanceRepository attendanceRepository;
    public final EmployeeRepository employeeRepository;


    public AttendanceService(AttendanceRepository attendanceRepository, EmployeeRepository employeeRepository) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
    }


    public void clockIn(Long employeeId) {
        LocalDate today = LocalDate.now();

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee Not Found"));


        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today);
        if (attendance != null) {
            throw new RuntimeException("Already clocked in!");
        } else {
            Attendance attendance1 = new Attendance();
            attendance1.setEmployee(employee);
            attendance1.setDate(today);
            attendance1.setClockIn(LocalDateTime.now());
            attendanceRepository.save(attendance1);
        }

    }

    public void clockOut(Long employeeId) {
        LocalDate today = LocalDate.now();

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee Not Found"));
        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today);
        if (attendance == null) {
            throw new RuntimeException("You have not clocked in today!");
        } else if (attendance.getClockOut() != null) {
            throw new RuntimeException("You have already Clocked out");
        } else {
            attendance.setClockOut(LocalDateTime.now());
            attendanceRepository.save(attendance);
        }

    }

    public List<Attendance> getEmployeeAttendanceHistory(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return attendanceRepository.findByEmployee(employee);
    }
}


