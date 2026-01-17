package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.Attendance;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.repository.AttendanceRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.service.AttendanceService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@CrossOrigin("http://localhost:5173")
@RequestMapping("/attendance")
@RestController
public class AttendanceController {
    public final AttendanceService attendanceService;


    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/clock-in")
    public void clockInController(Principal principal) {

        attendanceService.clockIn(principal.getName());
    }

    @PostMapping("/clock-out")
    public void clockOutController(Principal principal) {

        attendanceService.clockOut(principal.getName());
    }

    @GetMapping
    public List<Attendance> viewAttendanceLogOfEmployee(Principal principal) {
        return attendanceService.getEmployeeAttendanceHistory(principal.getName());
    }
}

