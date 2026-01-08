package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.Attendance;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.repository.AttendanceRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.service.AttendanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin("http://localhost:5173")
@RequestMapping("/attendance")
@RestController
public class AttendanceController {
    public final AttendanceService attendanceService;


    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/clock-in/{id}")
    public void clockInController(@PathVariable Long id) {

        attendanceService.clockIn(id);
    }

    @PostMapping("/clock-out/{id}")
    public void clockOutController(@PathVariable Long id) {

        attendanceService.clockOut(id);
    }

    @GetMapping("/{id}")
    public List<Attendance> viewAttendanceLogOfEmployee(@PathVariable Long id) {
        return attendanceService.getEmployeeAttendanceHistory(id);
    }
}
