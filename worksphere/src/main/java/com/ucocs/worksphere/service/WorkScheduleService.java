package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.WorkSchedule;
import com.ucocs.worksphere.enums.AuditAction;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.WorkScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkScheduleService {

    private final WorkScheduleRepository workScheduleRepository;
    private final AuditService auditService;
    private final EmployeeRepository employeeRepository;

    private UUID getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByUserName(username).map(e -> e.getId()).orElse(null);
    }

    public WorkSchedule createSchedule(WorkSchedule workSchedule) {
        WorkSchedule saved = workScheduleRepository.save(workSchedule);
        UUID performedBy = getCurrentUserId();
        if (performedBy != null) {
            auditService.log("WorkSchedule", saved.getId(), AuditAction.CREATED, performedBy, null, saved.getScheduleName());
        }
        return saved;
    }

    public WorkSchedule getScheduleById(UUID id) {
        return workScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Work Schedule not found with id: " + id));
    }

    public List<WorkSchedule> getAllSchedules() {
        return workScheduleRepository.findAll();
    }

    public WorkSchedule updateSchedule(UUID id, WorkSchedule updatedSchedule) {
        WorkSchedule existing = getScheduleById(id);
        String oldName = existing.getScheduleName();

        existing.setScheduleName(updatedSchedule.getScheduleName());
        existing.setTimezone(updatedSchedule.getTimezone());
        existing.setExpectedStart(updatedSchedule.getExpectedStart());
        existing.setExpectedEnd(updatedSchedule.getExpectedEnd());
        existing.setGracePeriodMin(updatedSchedule.getGracePeriodMin());
        existing.setBreakDurationMin(updatedSchedule.getBreakDurationMin());
        existing.setWorkingDays(updatedSchedule.getWorkingDays());

        WorkSchedule saved = workScheduleRepository.save(existing);
        UUID performedBy = getCurrentUserId();
        if (performedBy != null) {
            auditService.log("WorkSchedule", saved.getId(), AuditAction.UPDATED, performedBy, oldName, saved.getScheduleName());
        }
        return saved;
    }

    public void deleteSchedule(UUID id) {
        WorkSchedule schedule = workScheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        String oldName = schedule.getScheduleName();
        workScheduleRepository.delete(schedule);
        UUID performedBy = getCurrentUserId();
        if (performedBy != null) {
            auditService.log("WorkSchedule", id, AuditAction.DELETED, performedBy, oldName, null);
        }
    }
}