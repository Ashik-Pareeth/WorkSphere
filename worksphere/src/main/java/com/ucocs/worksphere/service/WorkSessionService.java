package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.WorkSession;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.WorkSessionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class WorkSessionService {
    private WorkSessionRepository workSessionRepository;
    private EmployeeRepository employeeRepository;

    public WorkSessionService(WorkSessionRepository workSessionRepository, EmployeeRepository employeeRepository) {
        this.workSessionRepository = workSessionRepository;
        this.employeeRepository = employeeRepository;
    }

    public void startSession(Long employeeId) {
        LocalDateTime startTime = LocalDateTime.now();

        Optional<Employee> employeeOpt = employeeRepository.findById(employeeId);
        Employee employee = employeeOpt.orElseThrow();

        WorkSession workSession = new WorkSession();
        Optional<WorkSession> workSession1 = workSessionRepository.findByEmployeeAndIsActiveTrue(employee);
        if (workSession1.isEmpty()) {
            workSession.setActive(true);
            workSession.setStartTime(startTime);
            workSession.setEmployee(employee);
            workSessionRepository.save(workSession);
        } else {
            throw new RuntimeException("Session is already active");
        }
    }

    public void endSession(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId).orElseThrow();
        Optional<WorkSession> workSession =
                workSessionRepository.findByEmployeeAndIsActiveTrue(employee);
        if (workSession.isPresent()) {
            WorkSession session = workSession.get();
            session.setEndTime(LocalDateTime.now());
            session.setActive(false);
            workSessionRepository.save(session);
        }
    }
}
